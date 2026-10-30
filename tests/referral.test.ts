import { test } from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/db";

import type { ReferralStatus } from "@prisma/client";
import {
  REFERRAL_TRANSITIONS,
  canTransition,
  isSelfReferral,
  isReferralStale,
  rewardExpiresAt,
  monthStartCopenhagen,
  planRewards,
  isValidRewardValue,
  assignReferralCode,
  createReferral,
  recordFirstVisit,
  ReferralError,
} from "../src/lib/referral";
import {
  CODE_ALPHABET,
  codeNamePart,
  codeSuffix,
  generateReferralCode,
  normalizeReferralCode,
} from "../src/lib/referral-code";
import { normalizePhone } from "../src/lib/phone";

type CodeDb = Parameters<typeof assignReferralCode>[1];
type CreateDb = Parameters<typeof createReferral>[1];

const DAY = 86_400_000;

// ── Tilstandsmaskinen: hver overgang ─────────────────────────────────

const ALL: ReferralStatus[] = ["CREATED", "VISITED", "REWARDED", "EXPIRED", "VOIDED"];

const ALLOWED = new Set([
  "CREATED>VISITED",
  "CREATED>EXPIRED",
  "CREATED>VOIDED",
  "VISITED>REWARDED",
  "VISITED>VOIDED",
]);

test("tilstandsmaskine: praecis de tilladte overgange (alle 25 par)", () => {
  for (const from of ALL) {
    for (const to of ALL) {
      assert.equal(
        canTransition(from, to),
        ALLOWED.has(`${from}>${to}`),
        `${from} -> ${to}`,
      );
    }
  }
});

test("tilstandsmaskine: rewarded, expired og voided er sluttilstande", () => {
  for (const end of ["REWARDED", "EXPIRED", "VOIDED"] as const) {
    assert.deepEqual(REFERRAL_TRANSITIONS[end], []);
  }
});

test("tilstandsmaskine: created kan ikke springe direkte til rewarded", () => {
  assert.equal(canTransition("CREATED", "REWARDED"), false);
});

// ── Regel: ingen selvhenvisning ──────────────────────────────────────

test("selvhenvisning: samme kort afvises", () => {
  assert.equal(isSelfReferral({ id: "a", phone: null }, { id: "a", phone: null }), true);
});

test("selvhenvisning: samme mobil i forskellige formater afvises", () => {
  assert.equal(
    isSelfReferral({ id: "a", phone: "12 34 56 78" }, { id: "b", phone: "+4512345678" }),
    true,
  );
  assert.equal(
    isSelfReferral({ id: "a", phone: "004512345678" }, { id: "b", phone: "12345678" }),
    true,
  );
});

test("selvhenvisning: forskellige kort og numre er tilladt", () => {
  assert.equal(
    isSelfReferral({ id: "a", phone: "12345678" }, { id: "b", phone: "87654321" }),
    false,
  );
  // Manglende mobil paa den ene eller begge: kun kort-id afgoer.
  assert.equal(isSelfReferral({ id: "a", phone: null }, { id: "b", phone: null }), false);
  assert.equal(isSelfReferral({ id: "a", phone: "12345678" }, { id: "b", phone: null }), false);
});

test("selvhenvisning: samme e-mail (uanset store bogstaver og mellemrum) afvises", () => {
  assert.equal(
    isSelfReferral(
      { id: "a", phone: null, contactEmail: "sara@test.dk" },
      { id: "b", phone: null, contactEmail: " Sara@Test.DK " },
    ),
    true,
  );
  // Forskellige e-mails er tilladt; et gammelt kort med samme mobil afvises stadig.
  assert.equal(
    isSelfReferral(
      { id: "a", phone: null, contactEmail: "sara@test.dk" },
      { id: "b", phone: null, contactEmail: "mette@test.dk" },
    ),
    false,
  );
  assert.equal(
    isSelfReferral(
      { id: "a", phone: "12345678", contactEmail: null },
      { id: "b", phone: "+4512345678", contactEmail: "ny@test.dk" },
    ),
    true,
  );
});

test("mobil normaliseres til +45-format, ugyldige giver null", () => {
  assert.equal(normalizePhone("12 34 56 78"), "+4512345678");
  assert.equal(normalizePhone("+45 12 34 56 78"), "+4512345678");
  assert.equal(normalizePhone("0045 12345678"), "+4512345678");
  assert.equal(normalizePhone("4512345678"), "+4512345678");
  assert.equal(normalizePhone("+46 701234567"), "+46701234567");
  assert.equal(normalizePhone("1234"), null);
  assert.equal(normalizePhone("+45 1234"), null);
  assert.equal(normalizePhone(""), null);
  assert.equal(normalizePhone(null), null);
});

// ── Regel: et kort kan kun have eet referred_by (det foerste vinder) ──

function makeCreateDb(opts: {
  enabled?: boolean;
  referrerPhone?: string | null;
  referredPhone?: string | null;
  alreadyReferred?: boolean;
}) {
  const created: unknown[] = [];
  const cards: Record<string, { id: string; phone: string | null; card: { businessId: string } }> = {
    ref: { id: "ref", phone: opts.referrerPhone ?? null, card: { businessId: "b1" } },
    new: { id: "new", phone: opts.referredPhone ?? null, card: { businessId: "b1" } },
  };
  const tx = {
    business: {
      async findUnique() {
        return { referralsEnabled: opts.enabled ?? true, stopped: false };
      },
    },
    customerCard: {
      async findUnique({ where }: { where: { id: string } }) {
        return cards[where.id] ?? null;
      },
      async updateMany() {
        return { count: opts.alreadyReferred ? 0 : 1 };
      },
    },
    referral: {
      async create({ data }: { data: unknown }) {
        created.push(data);
        return { id: "r1", ...(data as object) };
      },
    },
  };
  const db = {
    async $transaction(fn: (t: unknown) => Promise<unknown>) {
      return fn(tx);
    },
  };
  return { db: db as unknown as CreateDb, created };
}

const newReferral = (referredCardId = "new") => ({
  businessId: "b1",
  referrerCardId: "ref",
  referredCardId,
  source: "LINK" as const,
});

test("createReferral: opretter en aaben henvisning (created)", async () => {
  const { db, created } = makeCreateDb({});
  const r = await createReferral(newReferral(), db);
  assert.equal(r.id, "r1");
  assert.equal(created.length, 1);
});

test("createReferral: kortet er allerede henvist -> ALREADY_REFERRED, intet oprettet", async () => {
  const { db, created } = makeCreateDb({ alreadyReferred: true });
  await assert.rejects(createReferral(newReferral(), db), (e: unknown) => {
    return e instanceof ReferralError && e.code === "ALREADY_REFERRED";
  });
  assert.equal(created.length, 0);
});

test("createReferral: samme kort -> SELF_REFERRAL", async () => {
  const { db, created } = makeCreateDb({});
  await assert.rejects(
    createReferral({ ...newReferral(), referredCardId: "ref" }, db),
    (e: unknown) => e instanceof ReferralError && e.code === "SELF_REFERRAL",
  );
  assert.equal(created.length, 0);
});

test("createReferral: samme mobil -> SELF_REFERRAL", async () => {
  const { db } = makeCreateDb({ referrerPhone: "12345678", referredPhone: "+45 12 34 56 78" });
  await assert.rejects(
    createReferral(newReferral(), db),
    (e: unknown) => e instanceof ReferralError && e.code === "SELF_REFERRAL",
  );
});

test("createReferral: modulet slaaet fra -> DISABLED", async () => {
  const { db } = makeCreateDb({ enabled: false });
  await assert.rejects(
    createReferral(newReferral(), db),
    (e: unknown) => e instanceof ReferralError && e.code === "DISABLED",
  );
});

// ── Regel: foerste besoeg kraever staff-id ───────────────────────────

test("recordFirstVisit uden staff-id afvises foer databasen roeres", async () => {
  const db = {
    async $transaction() {
      throw new Error("maa ikke kaldes");
    },
  } as unknown as Parameters<typeof recordFirstVisit>[1];
  await assert.rejects(
    recordFirstVisit({ referralId: "r1", businessId: "b1" }, db),
    (e: unknown) => e instanceof ReferralError && e.code === "NO_STAFF",
  );
});

// ── Regel: loftet taelles paa rewarded ───────────────────────────────

const rule = {
  newCustomerRewardType: "AMOUNT" as const,
  newCustomerRewardValue: "100",
  referrerRewardType: "SERVICE" as const,
  referrerRewardValue: "Gratis klip",
  maxReferralsPerMonth: 2,
};

test("loft: under loftet faar baade ny kunde og henviser en beloenning", () => {
  const p = planRewards(rule, 1);
  assert.deepEqual(p.newCustomer, { type: "AMOUNT", value: "100" });
  assert.deepEqual(p.referrer, { type: "SERVICE", value: "Gratis klip" });
});

test("loft naaet: kun den nye kunde beloennes", () => {
  const p = planRewards(rule, 2);
  assert.deepEqual(p.newCustomer, { type: "AMOUNT", value: "100" });
  assert.equal(p.referrer, null);
});

test("loft null: intet loft", () => {
  const p = planRewards({ ...rule, maxReferralsPerMonth: null }, 1000);
  assert.ok(p.referrer);
});

test("loft 0: henviseren beloennes aldrig, den nye kunde altid", () => {
  const p = planRewards({ ...rule, maxReferralsPerMonth: 0 }, 0);
  assert.equal(p.referrer, null);
  assert.ok(p.newCustomer);
});

test("kalendermaaned starter den 1. kl. 00:00 dansk tid (sommer- og vintertid)", () => {
  // Oktober (CEST, +2): 1. okt 00:00 dansk = 30. sep 22:00 UTC.
  assert.equal(
    monthStartCopenhagen(new Date("2026-10-26T10:00:00Z")).toISOString(),
    "2026-09-30T22:00:00.000Z",
  );
  // November (CET, +1): 1. nov 00:00 dansk = 31. okt 23:00 UTC.
  assert.equal(
    monthStartCopenhagen(new Date("2026-11-15T12:00:00Z")).toISOString(),
    "2026-10-31T23:00:00.000Z",
  );
  // 31. okt 23:30 UTC er allerede 1. nov i Danmark.
  assert.equal(
    monthStartCopenhagen(new Date("2026-10-31T23:30:00Z")).toISOString(),
    "2026-10-31T23:00:00.000Z",
  );
});

// ── Regel: udloeb ────────────────────────────────────────────────────

test("henvisning er for gammel efter reward_expiry_days", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  assert.equal(isReferralStale(new Date(now.getTime() - 180 * DAY), 180, now), false);
  assert.equal(isReferralStale(new Date(now.getTime() - 180 * DAY - 1), 180, now), true);
  assert.equal(isReferralStale(new Date(now.getTime() - 10 * DAY), 180, now), false);
});

test("beloenningens expires_at = nu + reward_expiry_days", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  assert.equal(rewardExpiresAt(now, 180).toISOString(), "2027-04-24T12:00:00.000Z");
});

test("beloenningsvaerdier: amount/stamps positivt heltal, service tekst", () => {
  assert.equal(isValidRewardValue("AMOUNT", "100"), true);
  assert.equal(isValidRewardValue("STAMPS", "3"), true);
  assert.equal(isValidRewardValue("PERCENT", "20"), true);
  assert.equal(isValidRewardValue("PERCENT", "100"), true);
  assert.equal(isValidRewardValue("PERCENT", "101"), false);
  assert.equal(isValidRewardValue("PERCENT", "0"), false);
  assert.equal(isValidRewardValue("AMOUNT", "0"), false);
  assert.equal(isValidRewardValue("AMOUNT", "-5"), false);
  assert.equal(isValidRewardValue("STAMPS", "2.5"), false);
  assert.equal(isValidRewardValue("SERVICE", "Gratis klip"), true);
  assert.equal(isValidRewardValue("SERVICE", "   "), false);
});

// ── Kodegenerering ───────────────────────────────────────────────────

test("kode: foerste fornavn, store bogstaver, æøå omskrevet, max 6 tegn", () => {
  assert.equal(codeNamePart("Sara"), "SARA");
  assert.equal(codeNamePart("sara jensen"), "SARA");
  assert.equal(codeNamePart("Søren"), "SOEREN");
  assert.equal(codeNamePart("Åse"), "AASE");
  assert.equal(codeNamePart("Ærtebjerg"), "AERTEB");
  assert.equal(codeNamePart("Christoffer"), "CHRIST");
  assert.equal(codeNamePart("José"), "JOSE");
  assert.equal(codeNamePart("  Mette-Marie Holm"), "METTEM");
});

test("kode: tomt eller tegn-loest navn faar en reserve", () => {
  assert.equal(codeNamePart(""), "VEN");
  assert.equal(codeNamePart(null), "VEN");
  assert.equal(codeNamePart("123"), "VEN");
});

test("kode: alfabetet har ingen forvekslelige tegn (0, O, 1, I, L)", () => {
  for (const c of "0O1IL") assert.equal(CODE_ALPHABET.includes(c), false, c);
  assert.equal(new Set(CODE_ALPHABET).size, CODE_ALPHABET.length);
});

test("kode: formatet NAVN-XX", () => {
  for (let i = 0; i < 200; i++) {
    const code = generateReferralCode("Sara");
    assert.match(code, /^SARA-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{2}$/);
  }
  let n = 0;
  assert.equal(codeSuffix(2, () => n++), "AB");
  assert.equal(normalizeReferralCode(" sara-k8 "), "SARA-K8");
});

function makeCodeDb(opts: { collisions: number; existing?: string | null }) {
  const attempts: string[] = [];
  let collisions = opts.collisions;
  const db = {
    customerCard: {
      async findUnique() {
        return {
          referralCode: opts.existing ?? null,
          name: "Sara Jensen",
          card: { businessId: "b1" },
        };
      },
      async updateMany({ data }: { data: { referralCode: string } }) {
        attempts.push(data.referralCode);
        if (collisions > 0) {
          collisions--;
          throw Object.assign(new Error("unik"), { code: "P2002" });
        }
        return { count: 1 };
      },
    },
  };
  return { db: db as unknown as CodeDb, attempts };
}

test("kode: kollision -> nyt forsoeg", async () => {
  const { db, attempts } = makeCodeDb({ collisions: 2 });
  const code = await assignReferralCode({ customerCardId: "c1" }, db);
  assert.equal(attempts.length, 3);
  assert.equal(code, attempts[2]);
  assert.match(code, /^SARA-..$/);
});

test("kode: mange kollisioner -> tre tegn i stedet for at give op", async () => {
  const { db, attempts } = makeCodeDb({ collisions: 12 });
  const code = await assignReferralCode({ customerCardId: "c1" }, db);
  assert.match(code, /^SARA-...$/);
  assert.equal(attempts.length, 13);
});

test("kode: kortet har allerede en kode -> den genbruges", async () => {
  const { db, attempts } = makeCodeDb({ collisions: 0, existing: "SARA-K8" });
  assert.equal(await assignReferralCode({ customerCardId: "c1" }, db), "SARA-K8");
  assert.equal(attempts.length, 0);
});
