import { test } from "node:test";
import assert from "node:assert/strict";
import { cardShareText } from "../src/lib/overview-text";

const base = { stampsEnabled: false, stampsRequired: 10, rewardText: "", friendReward: null, referrerReward: null };

test("delebeskeden naevner stempelbeloenningen med lille forbogstav", () => {
  assert.equal(
    cardShareText({ ...base, stampsEnabled: true, rewardText: "Gratis kaffe" }),
    "Hent vores loyalitetskort på telefonen. 10 stempler giver gratis kaffe:",
  );
});

test("delebeskeden forklarer henvisningen, naar kortet kun har henvisninger", () => {
  assert.equal(
    cardShareText({ ...base, friendReward: "100 kr.", referrerReward: "gratis klip" }),
    "Hent vores loyalitetskort på telefonen. Del det med en ven: vennen får 100 kr., og du får gratis klip:",
  );
});

test("delebeskeden falder tilbage til en kort besked", () => {
  assert.equal(cardShareText(base), "Hent vores loyalitetskort på telefonen. Det tager få sekunder:");
});

test("yesterdayLine: kun det, der skete, i almindeligt dansk", async () => {
  const { yesterdayLine } = await import("../src/lib/overview-text");
  assert.equal(yesterdayLine({ stamps: 0, newCustomers: 0, rewards: 0 }), null);
  assert.equal(yesterdayLine({ stamps: 1, newCustomers: 0, rewards: 0 }), "I går: 1 stempel.");
  assert.equal(yesterdayLine({ stamps: 3, newCustomers: 1, rewards: 2 }), "I går: 3 stempler, 1 ny kunde og 2 belønninger givet.");
});
