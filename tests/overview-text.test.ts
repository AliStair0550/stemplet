import { test } from "node:test";
import assert from "node:assert/strict";
import { cardShareText } from "../src/lib/overview-text";

const base = { stampsEnabled: false, stampsRequired: 10, rewardText: "", friendReward: null, referrerReward: null };

test("delebeskeden naevner stempelbeloenningen med lille forbogstav", () => {
  assert.equal(
    cardShareText({ ...base, stampsEnabled: true, rewardText: "Gratis kaffe" }),
    "Hent vores kundekort på telefonen. 10 stempler giver gratis kaffe:",
  );
});

test("delebeskeden forklarer henvisningen, naar kortet kun har henvisninger", () => {
  assert.equal(
    cardShareText({ ...base, friendReward: "100 kr.", referrerReward: "gratis klip" }),
    "Hent vores kundekort på telefonen. Del det med en ven: vennen får 100 kr., og du får gratis klip:",
  );
});

test("delebeskeden falder tilbage til en kort besked", () => {
  assert.equal(cardShareText(base), "Hent vores kundekort på telefonen. Det tager få sekunder:");
});
