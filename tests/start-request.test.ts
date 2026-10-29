import { test } from "node:test";
import assert from "node:assert/strict";

import { startRequestSchema } from "../src/lib/start-request-schema";
import { superadminSignupRequestEmail } from "../src/lib/emails";

const base = { businessName: "Salon Nord", email: "sara@salon.dk" };

test("stempelkort alene: beloenning er stadig paakraevet (som foer)", () => {
  assert.equal(startRequestSchema.safeParse({ ...base, reward: "" }).success, false);
  const ok = startRequestSchema.safeParse({ ...base, reward: "10. klip gratis" });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.wantsReferrals, false);
});

test("henvisninger: kraever henvisningsbeloenninger, stempelbeloenning er valgfri", () => {
  assert.equal(startRequestSchema.safeParse({ ...base, wantsReferrals: true }).success, false);
  const ok = startRequestSchema.safeParse({
    ...base,
    wantsReferrals: true,
    referralReward: "Vennen faar 100 kr., du faar et gratis klip",
  });
  assert.equal(ok.success, true);
  assert.equal(ok.success && ok.data.reward, "");
});

test("mail til superadmin naevner Henvisninger kun naar valgt", () => {
  const d = {
    businessName: "Salon Nord",
    reward: "",
    contactName: "(ingen)",
    email: "sara@salon.dk",
    phone: "(ingen)",
    createUrl: "https://x/app/ny-butik",
  };
  const plain = superadminSignupRequestEmail(d);
  assert.doesNotMatch(plain.subject, /Henvisninger/);
  const ref = superadminSignupRequestEmail({ ...d, referralReward: "100 kr. <b>og</b> klip" });
  assert.match(ref.subject, /\(Henvisninger\)/);
  assert.match(ref.text, /Henvisninger: 100 kr\./);
  assert.match(ref.html, /&lt;b&gt;og&lt;\/b&gt;/);
});

test("kun henvisninger: gyldig uden stempelbeloenning, men mindst et produkt kraeves", () => {
  const only = startRequestSchema.safeParse({
    ...base,
    wantsReferrals: true,
    wantsStamps: false,
    referralReward: "Ven faar: 100 kr. Kunden faar: gratis klip.",
  });
  assert.equal(only.success, true);
  assert.equal(only.success && only.data.wantsStamps, false);
  assert.equal(startRequestSchema.safeParse({ ...base, reward: "x", wantsStamps: false }).success, false);
  // Uden feltet betyder det det samme som foer: stempelkort.
  const old = startRequestSchema.safeParse({ ...base, reward: "10. kaffe gratis" });
  assert.equal(old.success && old.data.wantsStamps, true);
});

test("mail til superadmin: kun henvisninger staar i emne og tekst", () => {
  const m = superadminSignupRequestEmail({
    businessName: "Salon Nord",
    reward: "",
    referralReward: "Ven faar: 100 kr.",
    referralsOnly: true,
    contactName: "(ingen)",
    email: "sara@salon.dk",
    phone: "(ingen)",
    createUrl: "https://x/app/ny-butik",
  });
  assert.match(m.subject, /\(kun Henvisninger\)/);
  assert.match(m.text, /slå Stemplet fra/);
});

import { folkaSender, loginEmail, welcomeEmail } from "../src/lib/emails";

test("login og velkomst baerer Folka, ikke Stemplet", () => {
  assert.equal(folkaSender("Stemplet <login@folka.dk>"), "Folka <login@folka.dk>");
  assert.equal(folkaSender("login@folka.dk"), "Folka <login@folka.dk>");
  for (const m of [loginEmail("https://x/l", "042917"), welcomeEmail("https://x/l", "042917")]) {
    assert.match(m.html, /Folka/);
    assert.doesNotMatch(m.html + m.text, /Stemplet\. Stempelkortet/);
    assert.match(m.html, /https:\/\/x\/l/);
    // Koden staar i baade HTML og tekst (let at laese: "042 917").
    assert.match(m.html, /042 917/);
    assert.match(m.text, /042 917/);
  }
  // Koden i emnet, saa iPhone kan foreslaa den i kodefeltet.
  assert.match(loginEmail("https://x/l", "042917").subject, /042917/);
});

import { generateLoginCode, normalizeLoginCode, formatLoginCode } from "../src/lib/login-code";
import { tipOfTheDay } from "../src/lib/emails";

test("login-kode: 6 cifre, taaler mellemrum, vises i to dele", () => {
  for (let i = 0; i < 200; i++) assert.match(generateLoginCode(), /^\d{6}$/);
  assert.equal(normalizeLoginCode(" 042 917 "), "042917");
  assert.equal(normalizeLoginCode("042-917"), "042917");
  assert.equal(normalizeLoginCode(null), "");
  assert.equal(formatLoginCode("042917"), "042 917");
});

test("dagens idé skifter fra dag til dag og er ens samme dag", () => {
  const d = new Date("2026-10-29T08:00:00Z");
  assert.equal(tipOfTheDay(d), tipOfTheDay(new Date("2026-10-29T20:00:00Z")));
  assert.notEqual(tipOfTheDay(d), tipOfTheDay(new Date("2026-10-30T08:00:00Z")));
});
