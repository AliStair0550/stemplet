import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Oprettelse af loyalitetskortet mod en RIGTIG Postgres: butikken vaelger fra
// start, hvad kortet kan (henvisninger, stempler eller begge), i een transaktion.

import { prisma } from "../../src/lib/prisma";
import { createLoyaltyBusiness, LoyaltyOnboardingError } from "../../src/lib/loyalty-onboarding";

after(async () => {
  await prisma.$disconnect();
});

async function cleanup(r: { businessId: string; userId: string }) {
  await prisma.business.delete({ where: { id: r.businessId } }).catch(() => {});
  await prisma.user.delete({ where: { id: r.userId } }).catch(() => {});
}

test("begge: stempler og henvisninger til, kort og regel oprettet", async () => {
  const r = await createLoyaltyBusiness({
    name: "IT Loyal",
    email: `it-${randomUUID()}@test.local`,
    stamps: { rewardText: " Gratis  kaffe ", stampsRequired: 8, stampIcon: "coffee" },
    referral: { friendReward: "100 kr.", referrerReward: "Gratis klip" },
  });
  try {
    const b = await prisma.business.findUniqueOrThrow({
      where: { id: r.businessId },
      include: { memberships: true, cards: true, referralRule: true },
    });
    assert.equal(b.stampsEnabled, true);
    assert.equal(b.referralsEnabled, true);
    assert.equal(b.memberships[0]!.userId, r.userId);
    assert.equal(b.cards[0]!.rewardText, "Gratis kaffe");
    assert.equal(b.cards[0]!.stampsRequired, 8);
    assert.equal(b.referralRule?.newCustomerRewardType, "AMOUNT");
    assert.equal(b.referralRule?.newCustomerRewardValue, "100");
    assert.equal(b.referralRule?.referrerRewardType, "SERVICE");
  } finally {
    await cleanup(r);
  }
});

test("kun henvisninger: stempler fra, men kortet findes (kundekort haenger paa det)", async () => {
  const r = await createLoyaltyBusiness({
    name: "IT Henvis",
    email: `it-${randomUUID()}@test.local`,
    stamps: null,
    referral: { friendReward: "10 %", referrerReward: "50 kr." },
  });
  try {
    const b = await prisma.business.findUniqueOrThrow({ where: { id: r.businessId }, include: { cards: true, referralRule: true } });
    assert.equal(b.stampsEnabled, false);
    assert.equal(b.referralsEnabled, true);
    assert.equal(b.cards.length, 1);
    assert.equal(b.referralRule?.newCustomerRewardType, "PERCENT");
  } finally {
    await cleanup(r);
  }
});

test("kun stempler: ingen henvisningsregel", async () => {
  const r = await createLoyaltyBusiness({
    name: "IT Stempel",
    email: `it-${randomUUID()}@test.local`,
    stamps: { rewardText: "Gratis is", stampsRequired: 10, stampIcon: "icecream" },
    referral: null,
  });
  try {
    const b = await prisma.business.findUniqueOrThrow({ where: { id: r.businessId }, include: { referralRule: true } });
    assert.equal(b.stampsEnabled, true);
    assert.equal(b.referralsEnabled, false);
    assert.equal(b.referralRule, null);
  } finally {
    await cleanup(r);
  }
});

test("intet valgt, ugyldige felter og brugt e-mail afvises foer der oprettes noget", async () => {
  const email = `it-${randomUUID()}@test.local`;
  const bad: [Parameters<typeof createLoyaltyBusiness>[0], string][] = [
    [{ name: "IT", email, stamps: null, referral: null }, "NO_MODULE"],
    [{ name: "IT", email, stamps: { rewardText: "x", stampsRequired: 10, stampIcon: "coffee" }, referral: null }, "INVALID_CARD"],
    [{ name: "IT", email, stamps: null, referral: { friendReward: " ", referrerReward: "100" } }, "INVALID_REWARD"],
  ];
  for (const [input, code] of bad) {
    await assert.rejects(createLoyaltyBusiness(input), (e: unknown) => e instanceof LoyaltyOnboardingError && e.code === code);
  }
  assert.equal(await prisma.user.count({ where: { email } }), 0);

  const r = await createLoyaltyBusiness({ name: "IT Foerst", email, stamps: null, referral: { friendReward: "100", referrerReward: "100" } });
  try {
    await assert.rejects(
      createLoyaltyBusiness({ name: "IT Igen", email, stamps: null, referral: { friendReward: "100", referrerReward: "100" } }),
      (e: unknown) => e instanceof LoyaltyOnboardingError && e.code === "EMAIL_TAKEN",
    );
  } finally {
    await cleanup(r);
  }
});

test("medarbejder-mail kan oprette sin egen butik; en ejer-mail kan ikke", async () => {
  const email = `it-staff-${randomUUID()}@test.local`;
  const first = await createLoyaltyBusiness({
    name: "IT Arbejdsgiver",
    email: `it-boss-${randomUUID()}@test.local`,
    stamps: { rewardText: "Gratis kaffe", stampsRequired: 10, stampIcon: "coffee" },
    referral: null,
  });
  // Ejeren tilfoejer en medarbejder (kun kassen).
  const staff = await prisma.user.create({ data: { email, businessId: first.businessId } });
  await prisma.membership.create({ data: { userId: staff.id, businessId: first.businessId, role: "STAFF" } });

  const own = await createLoyaltyBusiness({
    name: "IT Egen Salon",
    email,
    stamps: { rewardText: "Gratis klip", stampsRequired: 10, stampIcon: "scissors" },
    referral: null,
  });
  try {
    assert.equal(own.existingUser, true, "ingen ny bruger: samme login");
    assert.equal(own.userId, staff.id);
    const m = await prisma.membership.findUniqueOrThrow({
      where: { userId_businessId: { userId: staff.id, businessId: own.businessId } },
    });
    assert.equal(m.role, "OWNER");

    // Nu er mailen ejer, og saa skal man logge ind i stedet.
    await assert.rejects(
      createLoyaltyBusiness({ name: "IT Tredje", email, stamps: { rewardText: "Gratis kaffe", stampsRequired: 10, stampIcon: "coffee" }, referral: null }),
      (e: unknown) => e instanceof LoyaltyOnboardingError && e.code === "EMAIL_TAKEN",
    );
  } finally {
    await prisma.business.delete({ where: { id: own.businessId } }).catch(() => {});
    await cleanup(first);
  }
});
