import { test } from "node:test";
import assert from "node:assert/strict";
import { autoCardName, cardShortName, claimCta, parseCardName } from "../src/lib/card-name";

test("korte navne bruges helt", () => {
  assert.equal(autoCardName("Sara Salon"), "Sara Salon");
  assert.equal(autoCardName("  Express   Pizza "), "Express Pizza");
});

test("lange navne: de foerste ord, der kan vaere der", () => {
  assert.equal(autoCardName("Milano Pizza Mors"), "Milano Pizza");
  assert.equal(autoCardName("Philly & Burger Nykøbing"), "Philly & Burger");
  assert.equal(autoCardName("Bager og Konditor Hansen"), "Bager");
});

test("selskabsform fjernes, og et langt ord klippes aldrig", () => {
  assert.equal(autoCardName("Sara Salon ApS"), "Sara Salon");
  assert.equal(autoCardName("Kaffe I/S"), "Kaffe");
  assert.equal(autoCardName("Frisørsalonkæden Nord"), "Frisørsalonkæden");
});

test("butikkens eget navn vinder, ellers visningsnavnet", () => {
  assert.equal(cardShortName({ cardName: "Milano", name: "Milano Pizza Mors" }), "Milano");
  assert.equal(cardShortName({ cardName: " ", displayName: "Sara", name: "Sara Salon ApS" }), "Sara");
  assert.equal(cardShortName({ name: "Sara Salon ApS" }), "Sara Salon");
});

test("knapteksten", () => {
  assert.equal(claimCta("Sara Salon"), "Hent dit Sara Salon-kort");
});

test("validering af eget navn", () => {
  assert.deepEqual(parseCardName(""), { ok: true, value: null });
  assert.deepEqual(parseCardName("  Milano  "), { ok: true, value: "Milano" });
  assert.equal(parseCardName("Et alt for langt kortnavn").ok, false);
  assert.equal(parseCardName("&&").ok, false);
});
