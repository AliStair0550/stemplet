import { test } from "node:test";
import assert from "node:assert/strict";
import { offerInputSchema, offerIsLive, endOfDay } from "../src/lib/member-offers";

test("tilbud: overskrift kraeves, partner kraever navn, link skal vaere https", () => {
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "10 % på alt" }).success, true);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "PARTNER", title: "10 % rabat" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "PARTNER", title: "10 % rabat", partnerName: "Café Sol" }).success, true);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "http://x.dk" }).success, false);
  assert.equal(offerInputSchema.safeParse({ kind: "OFFER", title: "Tilbud", link: "https://x.dk" }).success, true);
});

test("tilbud: vises kun naar aktivt og ikke udloebet", () => {
  const now = new Date("2026-11-10T12:00:00Z");
  assert.equal(offerIsLive({ active: true, endsAt: null }, now), true);
  assert.equal(offerIsLive({ active: false, endsAt: null }, now), false);
  assert.equal(offerIsLive({ active: true, endsAt: endOfDay("2026-11-10") }, now), true, "hele dagen med");
  assert.equal(offerIsLive({ active: true, endsAt: endOfDay("2026-11-09") }, now), false);
});
