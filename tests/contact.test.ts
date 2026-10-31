import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, normalizeName, parseContact, CONTACT_NAME_MAX, maskEmail } from "../src/lib/contact";

// Kontaktdata ved kortet: navn og e-mail er paakraevet, samtykke er frivilligt.

test("e-mail trimmes og goeres til smaa bogstaver", () => {
  assert.equal(normalizeEmail("  Sara@Eksempel.DK "), "sara@eksempel.dk");
  assert.equal(normalizeEmail("a.b+tag@sub.domain.dk"), "a.b+tag@sub.domain.dk");
});

test("aabenlyst ugyldige e-mails afvises", () => {
  for (const bad of ["", "sara", "sara@", "@test.dk", "sara@test", "sa ra@test.dk", "sara@@test.dk", "sara@test..dk", null, undefined]) {
    assert.equal(normalizeEmail(bad as string | null | undefined), null, String(bad));
  }
  assert.equal(normalizeEmail(`${"a".repeat(250)}@t.dk`), null, "for lang");
});

test("navn: mellemrum ryddes, tomt og for langt afvises", () => {
  assert.equal(normalizeName("  Sara   Jensen "), "Sara Jensen");
  assert.equal(normalizeName("   "), null);
  assert.equal(normalizeName("x".repeat(CONTACT_NAME_MAX + 1)), null);
});

test("parseContact: samtykke kun ved et aktivt flueben", () => {
  assert.deepEqual(parseContact({ name: "Sara", email: "SARA@test.dk" }), {
    ok: true,
    contact: { name: "Sara", email: "sara@test.dk", consent: false },
  });
  const yes = parseContact({ name: "Sara", email: "sara@test.dk", consent: true });
  assert.ok(yes.ok && yes.contact.consent);
  assert.deepEqual(parseContact({ name: "", email: "sara@test.dk" }), { ok: false, error: "navn" });
  assert.deepEqual(parseContact({ name: "Sara", email: "nej" }), { ok: false, error: "mail" });
});

test("maskEmail: viser kun starten af mailen (Find kort)", () => {
  assert.equal(maskEmail("emma.holm@gmail.com"), "em***@gmail.com");
  assert.equal(maskEmail("a@b.dk"), "a***@b.dk");
  assert.ok(!maskEmail("hemmelig.person@firma.dk").includes("hemmelig"));
});

test("usynlige tegn og styretegn: fjernes fra navn, afvises i e-mail", () => {
  assert.equal(normalizeName("Sa\u200Bra\u0000"), "Sara");
  assert.equal(normalizeName("\u200B\u200B"), null, "kun usynlige tegn");
  assert.equal(normalizeName("Mor \u{1F469}\u200D\u{1F467}"), "Mor \u{1F469}\u200D\u{1F467}", "ZWJ-emoji bevares");
  assert.equal(normalizeEmail("sara\u200B@gmail.com"), null);
  assert.equal(normalizeEmail("sara\u0000@gmail.com"), null);
  assert.equal(normalizeEmail("<sara>@gmail.com"), null);
  assert.equal(normalizeEmail("sara,b@gmail.com"), null);
});
