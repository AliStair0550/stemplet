import { test } from "node:test";
import assert from "node:assert/strict";
import { offerInputSchema, offerIsLive, endOfDay, normalizeOfferLink, offerPushText } from "../src/lib/member-offers";

test("tilbud: overskrift kraeves, partner kraever navn, link skal vaere https", () => {
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "10 % på alt" }).success, true);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "PARTNER", title: "10 % rabat" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "PARTNER", title: "10 % rabat", partnerName: "Café Sol" }).success, true);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "https://x.dk" }).success, true);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "javascript:alert(1)" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "ikke et link" }).success, false);
});

test("tilbud: https saettes paa linket automatisk", () => {
  assert.equal(normalizeOfferLink("dinbutik.dk"), "https://dinbutik.dk");
  assert.equal(normalizeOfferLink(" www.cafe-sol.dk/menu "), "https://www.cafe-sol.dk/menu");
  assert.equal(normalizeOfferLink("http://x.dk"), "https://x.dk");
  assert.equal(normalizeOfferLink("HTTPS://x.dk"), "HTTPS://x.dk");
  assert.equal(normalizeOfferLink(""), "");
  const parsed = offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "dinbutik.dk" });
  assert.equal(parsed.success && parsed.data.link, "https://dinbutik.dk");
});

test("tilbud: faerdig pushbesked om tilbud og partner", () => {
  assert.equal(offerPushText({ kind: "OFFER", title: "20 % på kager." }), "Nyt tilbud til dig med kortet: 20 % på kager. Se det under Tilbud og fordele.");
  assert.equal(
    offerPushText({ kind: "PARTNER", title: "10 % rabat", partnerName: "Café Sol" }),
    "Ny fordel med kortet: 10 % rabat hos Café Sol. Vis kortet, så får du rabatten.",
  );
  assert.ok(offerPushText({ kind: "OFFER", title: "x".repeat(60) }, 50).length <= 50);
});

test("tilbud: vises kun naar aktivt og ikke udloebet", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  assert.equal(offerIsLive({ active: true, endsAt: null }, now), true);
  assert.equal(offerIsLive({ active: false, endsAt: null }, now), false);
  assert.equal(offerIsLive({ active: true, endsAt: endOfDay("2026-11-10") }, now), true, "hele dagen med");
  assert.equal(offerIsLive({ active: true, endsAt: endOfDay("2026-11-09") }, now), false);
});
