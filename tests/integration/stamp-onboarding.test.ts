import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Selvbetjent oprettelse af Stemplet mod en RIGTIG Postgres: butik, ejer,
// medlemskab og stempelkort i een transaktion, Stemplet til og Henvisninger fra.

import { prisma } from "../../src/lib/prisma";
import { createStampBusiness, StampOnboardingError } from "../../src/lib/stamp-onboarding";

after(async () => {
  await prisma.$disconnect();
});

test("oprettelse af Stemplet: kort med beloenning, stempler og ikon", async () => {
  const email = `it-${randomUUID()}@test.local`;
  const r = await createStampBusiness({
    name: "IT Cafe",
    email,
    rewardText: "  Gratis   kaffe ",
    stampsRequired: 8,
    stampIcon: "coffee",
  });
  try {
    const b = await prisma.business.findUniqueOrThrow({
      where: { id: r.businessId },
      include: { memberships: true, cards: true },
    });
    assert.equal(b.stampsEnabled, true);
    assert.equal(b.referralsEnabled, false);
    assert.ok(b.termsAcceptedAt);
    assert.equal(b.memberships[0]!.userId, r.userId);
    assert.equal(b.cards.length, 1);
    assert.equal(b.cards[0]!.rewardText, "Gratis kaffe");
    assert.equal(b.cards[0]!.stampsRequired, 8);
    assert.equal(b.cards[0]!.stampIcon, "coffee");

    await assert.rejects(
      createStampBusiness({ name: "IT Cafe 2", email, rewardText: "Kaffe", stampsRequired: 10, stampIcon: "coffee" }),
      (e: unknown) => e instanceof StampOnboardingError && e.code === "EMAIL_TAKEN",
    );
  } finally {
    await prisma.business.delete({ where: { id: r.businessId } }).catch(() => {});
    await prisma.user.delete({ where: { id: r.userId } }).catch(() => {});
  }
});

test("oprettelse af Stemplet: ugyldigt kort afvises foer der oprettes noget", async () => {
  const email = `it-${randomUUID()}@test.local`;
  for (const bad of [
    { rewardText: "x", stampsRequired: 10, stampIcon: "coffee" },
    { rewardText: "Gratis kaffe", stampsRequired: 30, stampIcon: "coffee" },
    { rewardText: "Gratis kaffe", stampsRequired: 10, stampIcon: "ukendt" },
  ]) {
    await assert.rejects(
      createStampBusiness({ name: "IT Bad", email, ...bad }),
      (e: unknown) => e instanceof StampOnboardingError && e.code === "INVALID_CARD",
    );
  }
  assert.equal(await prisma.user.count({ where: { email } }), 0);
});
