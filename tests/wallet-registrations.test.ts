import { test } from "node:test";
import assert from "node:assert/strict";

import { changedSince } from "../src/lib/wallet/registrations";

const at = (ms: number) => new Date(ms);
const cards = [
  { serial: "A", passUpdatedAt: at(1_000) },
  { serial: "B", passUpdatedAt: at(5_000) },
  { serial: "C", passUpdatedAt: at(3_000) },
];

test("uden passesUpdatedSince faar enheden alle kort og det nyeste tidsstempel", () => {
  assert.deepEqual(changedSince(cards, null), { serialNumbers: ["A", "B", "C"], lastUpdated: "5000" });
});

test("med passesUpdatedSince kommer kun kort, der er aendret siden", () => {
  assert.deepEqual(changedSince(cards, "2000"), { serialNumbers: ["B", "C"], lastUpdated: "5000" });
});

test("intet aendret giver null (ruten svarer 204)", () => {
  assert.equal(changedSince(cards, "5000"), null);
  assert.equal(changedSince([], null), null);
});

test("et ugyldigt tidsstempel (fx fra den gamle version) behandles som 'alle'", () => {
  assert.equal(changedSince(cards, "abc")?.serialNumbers.length, 3);
});
