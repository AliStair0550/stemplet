import { test } from "node:test";
import assert from "node:assert/strict";

// AUTH_SECRET kraeves af token-signeringen. Saettes foer import af tokens.
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET ?? "test-secret-at-least-32-chars-long-000000";

import {
  marketingSignupSchema,
  marketingSourceLabel,
} from "../src/lib/marketing";
import {
  signMarketingConfirmToken,
  verifyMarketingConfirmToken,
  signUnsubscribeToken,
} from "../src/lib/tokens";
import {
  marketingConfirmEmail,
  superadminMarketingSignupEmail,
} from "../src/lib/emails";

const DASH_RE = /[—–]/;

// ── Validering ────────────────────────────────────────────────────────
test("schema: fuld tilmelding er gyldig", () => {
  const r = marketingSignupSchema.safeParse({
    name: "Ali",
    storeName: "Kaffebar",
    email: "Ali@Example.dk",
    source: "forside",
  });
  assert.ok(r.success);
  // Mail normaliseres (trim + lowercase), saa dubletter fanges af unik'en.
  assert.equal(r.data.email, "ali@example.dk");
});

test("schema: kompakt (kun mail + kilde) er gyldig", () => {
  const r = marketingSignupSchema.safeParse({
    email: "kun@mail.dk",
    source: "footer",
  });
  assert.ok(r.success);
  assert.equal(r.data.name, undefined);
  assert.equal(r.data.storeName, undefined);
});

test("schema: ugyldig mail afvises", () => {
  assert.equal(
    marketingSignupSchema.safeParse({ email: "ikke-en-mail", source: "forside" })
      .success,
    false,
  );
});

test("schema: for langt navn afvises", () => {
  assert.equal(
    marketingSignupSchema.safeParse({
      name: "x".repeat(81),
      email: "a@b.dk",
      source: "forside",
    }).success,
    false,
  );
});

// ── Kilde-etiket ──────────────────────────────────────────────────────
test("kilde-etiket: forside/footer/branche-slug", () => {
  assert.equal(marketingSourceLabel("forside"), "Forside");
  assert.equal(marketingSourceLabel("footer"), "Footer");
  assert.equal(
    marketingSourceLabel("/stempelkort-til-kaffebarer"),
    "Kaffebarer",
  );
});

// ── Bekraeft-token ────────────────────────────────────────────────────
test("bekraeft-token: round-trip giver samme id", async () => {
  const token = await signMarketingConfirmToken("signup_123");
  assert.equal(await verifyMarketingConfirmToken(token), "signup_123");
});

test("bekraeft-token: afviser token med forkert formaal", async () => {
  const unsub = await signUnsubscribeToken("biz_1");
  await assert.rejects(() => verifyMarketingConfirmToken(unsub));
});

// ── Mails ─────────────────────────────────────────────────────────────
test("bekraeftelses-mail: subject + link + ingen lange bindestreger", () => {
  const url = "https://stemplet.alius.dk/api/marketing/confirm?token=abc";
  const mail = marketingConfirmEmail(url);
  assert.equal(mail.subject, "Bekræft din tilmelding til Stemplet");
  assert.ok(mail.html.includes(url));
  assert.ok(mail.text.includes(url));
  assert.ok(!DASH_RE.test(mail.subject + mail.html + mail.text));
});

test("notifikations-mail: indeholder mail + kilde, ingen lange bindestreger", () => {
  const mail = superadminMarketingSignupEmail({
    name: "Ali",
    storeName: "Kaffebar",
    email: "ny@kunde.dk",
    source: "Forside",
    adminUrl: "https://stemplet.alius.dk/admin/marketing",
  });
  assert.ok(mail.html.includes("ny@kunde.dk"));
  assert.ok(mail.text.includes("Forside"));
  assert.ok(!DASH_RE.test(mail.subject + mail.html + mail.text));
});
