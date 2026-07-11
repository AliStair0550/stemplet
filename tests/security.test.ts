import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// Token-tests skal kunne signere/verificere uden .env.
process.env.STAMP_TOKEN_SECRET =
  process.env.STAMP_TOKEN_SECRET ?? "test-secret-kun-til-tests-1234567890";

import { consumeJti, jtiKey, signStampToken, verifyStampToken } from "../src/lib/tokens";
import { trackStampAnomaly } from "../src/lib/security";

// ── In-memory fake af det lille Redis-udsnit, motoren bruger ──────────
function makeFakeRedis() {
  const kv = new Map<string, string>();
  const sets = new Map<string, Set<string>>();
  return {
    async set(key: string, value: string, opts: { nx?: boolean; ex?: number }) {
      if (opts?.nx && kv.has(key)) return null;
      kv.set(key, value);
      return "OK";
    },
    async incr(key: string) {
      const n = Number(kv.get(key) ?? "0") + 1;
      kv.set(key, String(n));
      return n;
    },
    async expire() {
      return 1;
    },
    async sadd(key: string, member: string) {
      let s = sets.get(key);
      if (!s) {
        s = new Set();
        sets.set(key, s);
      }
      const had = s.has(member);
      s.add(member);
      return had ? 0 : 1;
    },
    async scard(key: string) {
      return sets.get(key)?.size ?? 0;
    },
  };
}

// ── Item 1: token engangs PR. KORT ───────────────────────────────────

test("jtiKey er unik pr. (token, kort)", () => {
  assert.equal(jtiKey("J", "A"), jtiKey("J", "A"));
  assert.notEqual(jtiKey("J", "A"), jtiKey("J", "B"));
});

test("tre forskellige kort kan bruge SAMME token succesfuldt", async () => {
  const redis = makeFakeRedis();
  const jti = "token-koe-1";
  assert.equal(await consumeJti(jti, "kort-A", redis), true);
  assert.equal(await consumeJti(jti, "kort-B", redis), true);
  assert.equal(await consumeJti(jti, "kort-C", redis), true);
});

test("samme kort afvises ved genbrug af samme token", async () => {
  const redis = makeFakeRedis();
  const jti = "token-genbrug-1";
  assert.equal(await consumeJti(jti, "kort-A", redis), true);
  assert.equal(await consumeJti(jti, "kort-A", redis), false);
});

// ── Item 2: anomali-detektion uden café-wifi-støj ────────────────────

test("café: mange forskellige kort, samme IP, samme butik -> IKKE flaget", async () => {
  const redis = makeFakeRedis();
  let anyFlagged = false;
  for (let i = 0; i < 30; i++) {
    const r = await trackStampAnomaly(
      { businessId: "biz-1", customerCardId: `kort-${i}`, ip: "203.0.113.9" },
      redis,
    );
    anyFlagged = anyFlagged || r.flagged;
  }
  assert.equal(anyFlagged, false);
});

test("samme kort får unormalt mange stempler -> flaget (card-volume)", async () => {
  const redis = makeFakeRedis();
  let last;
  for (let i = 0; i < 16; i++) {
    last = await trackStampAnomaly(
      { businessId: "biz-1", customerCardId: "kort-hot", ip: "203.0.113.9" },
      redis,
    );
  }
  assert.equal(last!.flagged, true);
  assert.equal(last!.reason, "card-volume");
});

test("samme IP mod mange kort OG flere butikker -> flaget (ip-cross-business)", async () => {
  const redis = makeFakeRedis();
  let anyCross = false;
  for (let i = 0; i < 14; i++) {
    const r = await trackStampAnomaly(
      { businessId: `biz-${i % 5}`, customerCardId: `kort-${i}`, ip: "198.51.100.7" },
      redis,
    );
    if (r.flagged && r.reason === "ip-cross-business") anyCross = true;
  }
  assert.equal(anyCross, true);
});

// ── Item 3: GET på /s/<token> må ikke have sideeffekter ──────────────

test("verificering af token forbruger det IKKE (kun POST/consumeJti gør)", async () => {
  const redis = makeFakeRedis();
  const { token } = await signStampToken({ businessId: "biz-1", cardId: "card-1" });
  // Det, GET-siden gør: verificerer. Må ikke brænde tokenet.
  const payload = await verifyStampToken(token);
  // Bagefter er tokenet stadig friskt for et kort (POST-vejen kan stemple).
  assert.equal(await consumeJti(payload.jti, "kort-A", redis), true);
});

test("/s/[token]-siden stempler ikke i server-komponenten (ingen sideeffekt)", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(
    join(here, "../src/app/s/[token]/page.tsx"),
    "utf8",
  );
  // Ingen stempel-skrivende kald i GET-server-komponenten.
  assert.equal(/consumeJti|applyStamp|prisma\.stamp/.test(src), false);
  // Stempling delegeres til klientens POST via StampConfirm.
  assert.match(src, /StampConfirm/);
});
