import { test } from "node:test";
import assert from "node:assert/strict";

import {
  rewardPhrase,
  firstName,
  referralShareUrl,
  referralShareText,
} from "../src/lib/referral-text";

const NBSP = " ";

test("beloenning: beloeb og stempler med haardt mellemrum", () => {
  assert.equal(rewardPhrase("AMOUNT", "100"), `100${NBSP}kr.`);
  assert.equal(rewardPhrase("STAMPS", "3"), `3${NBSP}stempler`);
  assert.equal(rewardPhrase("STAMPS", "1"), `1${NBSP}stempel`);
});

test("beloenning: service faar lille forbogstav midt i saetningen", () => {
  assert.equal(rewardPhrase("SERVICE", "Gratis klip"), "gratis klip");
  assert.equal(rewardPhrase("SERVICE", "SPA-behandling"), "SPA-behandling");
  assert.equal(rewardPhrase("SERVICE", "Øjenbrynsfarvning"), "øjenbrynsfarvning");
});

test("fornavn til overskriften", () => {
  assert.equal(firstName("sara jensen"), "Sara");
  assert.equal(firstName("  Mikkel "), "Mikkel");
  assert.equal(firstName(""), null);
  assert.equal(firstName(null), null);
});

test("delelink og -besked", () => {
  assert.equal(
    referralShareUrl("https://stemplet.alius.dk", "sara-salon", "SARA-K8"),
    "https://stemplet.alius.dk/henvisninger/sara-salon?k=SARA-K8",
  );
  assert.equal(
    referralShareText("Sara Salon", `100${NBSP}kr.`),
    `Jeg har en rabat til dig hos Sara Salon: 100${NBSP}kr. ved dit første besøg.`,
  );
});
