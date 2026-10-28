import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Selvbetjent oprettelse via Henvisninger mod en RIGTIG Postgres: butik, ejer,
// medlemskab og regel i een transaktion, Henvisninger til og Stemplet fra.

import { prisma } from "../../src/lib/prisma";
import { createReferralBusiness, ReferralOnboardingError } from "../../src/lib/referral-onboarding";

after(async () => {
  await prisma.$disconnect();
});

test("oprettelse via Henvisninger: kun Henvisninger, regel fra fri tekst og medlemskab", async () => {
  const email = `it-${randomUUID()}@test.local`;
  const r = await createReferralBusiness({
    name: "IT Salon",
    email,
    friendReward: "150 kr.",
    referrerReward: "Gratis vask",
  });
  try {
    const b = await prisma.business.findUniqueOrThrow({
      where: { id: r.businessId },
      include: { referralRule: true, memberships: true, cards: true },
    });
    assert.equal(b.referralsEnabled, true);
    assert.equal(b.stampsEnabled, false);
    assert.ok(b.termsAcceptedAt);
    assert.equal(b.memberships.length, 1);
    assert.equal(b.memberships[0]!.userId, r.userId);
    assert.equal(b.cards.filter((c) => c.active).length, 1);
    assert.equal(b.referralRule?.newCustomerRewardType, "AMOUNT");
    assert.equal(b.referralRule?.newCustomerRewardValue, "150");
    assert.equal(b.referralRule?.referrerRewardType, "SERVICE");
    assert.equal(b.referralRule?.referrerRewardValue, "Gratis vask");
    // Ingen betingelser som standard.
    assert.equal(b.referralRule?.maxReferralsPerMonth, null);
    assert.equal(b.referralRule?.minPurchaseKr, null);
    assert.equal(b.referralRule?.termsLine, null);

    // Samme e-mail igen: en venlig fejl, ingen ny butik.
    await assert.rejects(
      createReferralBusiness({ name: "IT Salon 2", email, friendReward: "100", referrerReward: "100" }),
      (e: unknown) => e instanceof ReferralOnboardingError && e.code === "EMAIL_TAKEN",
    );
  } finally {
    await prisma.business.delete({ where: { id: r.businessId } }).catch(() => {});
    await prisma.user.delete({ where: { id: r.userId } }).catch(() => {});
  }
});
