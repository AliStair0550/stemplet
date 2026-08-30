import { test } from "node:test";
import assert from "node:assert/strict";

import { marketingSignupSchema } from "../src/lib/marketing-schema";
import { marketingSourceLabel } from "../src/lib/marketing";
import {
  marketingWelcomeEmail,
  superadminMarketingSignupEmail,
} from "../src/lib/emails";

// Lange bindestreger (em/en-dash) via unicode-escape, saa selve testfilen ikke
// indeholder dem (og ikke selv fanges af dash-gaten).
const DASH_RE = /[\u2014\u2013]/;

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

// ── Mails ─────────────────────────────────────────────────────────────
test("velkomstmail: med og uden navn, ingen lange bindestreger", () => {
  const withName = marketingWelcomeEmail("Ali");
  assert.equal(withName.subject, "Du er skrevet op hos Stemplet");
  assert.ok(withName.html.includes("Hej Ali."));
  const noName = marketingWelcomeEmail(null);
  assert.ok(noName.html.includes("Hej."));
  assert.ok(
    !DASH_RE.test(
      withName.subject + withName.html + withName.text + noName.html,
    ),
  );
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
