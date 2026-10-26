import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Integrationstests for henvisninger ved kassen og i dashboardet (fase 3) mod en
// RIGTIG Postgres. Indloesning under aegte samtidighed, soegning scopet pr. butik,
// resultatkortet og dashboardets tal.

import { prisma } from "../../src/lib/prisma";
import {
  createReferral,
  recordFirstVisit,
  redeemReward,
  saveReferralRule,
  assignReferralCode,
  ReferralError,
} from "../../src/lib/referral";
import {
  searchDeskCustomers,
  getDeskCustomer,
  getReferralOverview,
  referralExportRows,
} from "../../src/lib/referral-desk";

// Prisma indlaeser .env ved import; testene maa aldrig ramme en rigtig Redis.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

after(async () => {
  await prisma.$disconnect();
});

async function makeShop() {
  const biz = await prisma.business.create({
    data: {
      name: "IT-kasse",
      slug: `it-kasse-${randomUUID()}`,
      referralsEnabled: true,
      cards: { create: { rewardText: "Gratis klip" } },
      devices: { create: { name: "Kasse", tokenHash: randomUUID() } },
    },
    include: { cards: true, devices: true },
  });
  await saveReferralRule(biz.id, {
    newCustomerRewardType: "AMOUNT",
    newCustomerRewardValue: "100",
    referrerRewardType: "AMOUNT",
    referrerRewardValue: "50",
  });
  return { bizId: biz.id, cardId: biz.cards[0]!.id, deviceId: biz.devices[0]!.id };
}

async function makeCustomer(s: { bizId: string; cardId: string }, name: string, phone: string) {
  const cc = await prisma.customerCard.create({
    data: {
      cardId: s.cardId,
      businessId: s.bizId,
      serial: randomUUID().slice(0, 12),
      authToken: randomUUID(),
      name,
      phone,
    },
    select: { id: true, serial: true },
  });
  const code = await assignReferralCode({ customerCardId: cc.id });
  return { ...cc, code };
}

async function cleanup(bizId: string) {
  await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
}

/** Sara henviser Mikkel, og kassen registrerer foerste besoeg. */
async function rewardedPair(s: Awaited<ReturnType<typeof makeShop>>) {
  const sara = await makeCustomer(s, "Sara Jensen", "+4511111111");
  const mikkel = await makeCustomer(s, "Mikkel Holm", "+4522222222");
  const ref = await createReferral({
    businessId: s.bizId,
    referrerCardId: sara.id,
    referredCardId: mikkel.id,
    source: "MANUAL_AT_DESK",
  });
  const visit = await recordFirstVisit({
    referralId: ref.id,
    businessId: s.bizId,
    staffDeviceId: s.deviceId,
  });
  return { sara, mikkel, ref, visit };
}

// ── Beloenning indloest ──────────────────────────────────────────────

test("indloesning: available -> redeemed med staff og tidspunkt", async () => {
  const s = await makeShop();
  try {
    const { visit } = await rewardedPair(s);
    const reward = visit.rewards.find((r) => r.role === "newCustomer")!;
    const res = await redeemReward({
      rewardId: reward.id,
      businessId: s.bizId,
      staffDeviceId: s.deviceId,
      idempotencyKey: "k1",
    });
    assert.equal(res.value, "100");
    const row = await prisma.reward.findUniqueOrThrow({ where: { id: reward.id } });
    assert.equal(row.status, "REDEEMED");
    assert.ok(row.redeemedAt);
    assert.equal(row.redeemedByStaffDeviceId, s.deviceId);
  } finally {
    await cleanup(s.bizId);
  }
});

test("indloesning: dobbelttryk med samme noegle giver samme svar, ingen fejl", async () => {
  const s = await makeShop();
  try {
    const { visit } = await rewardedPair(s);
    const rewardId = visit.rewards[0]!.id;
    const call = () =>
      redeemReward({ rewardId, businessId: s.bizId, staffDeviceId: s.deviceId, idempotencyKey: "samme" });
    const first = await call();
    const [a, b] = await Promise.all([call(), call()]);
    assert.deepEqual(a, first);
    assert.deepEqual(b, first);
  } finally {
    await cleanup(s.bizId);
  }
});

test("indloesning: to samtidige tryk med forskellige noegler giver praecis een", async () => {
  const s = await makeShop();
  try {
    const { visit } = await rewardedPair(s);
    const rewardId = visit.rewards[0]!.id;
    const results = await Promise.allSettled(
      ["a", "b"].map((k) =>
        redeemReward({ rewardId, businessId: s.bizId, staffDeviceId: s.deviceId, idempotencyKey: k }),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const err = (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason;
    assert.ok(err instanceof ReferralError && err.code === "INVALID_TRANSITION");
  } finally {
    await cleanup(s.bizId);
  }
});

test("indloesning: udloebet beloenning, anden butik og manglende staff afvises", async () => {
  const s = await makeShop();
  const other = await makeShop();
  try {
    const { visit } = await rewardedPair(s);
    const rewardId = visit.rewards[0]!.id;
    await assert.rejects(
      redeemReward({ rewardId, businessId: other.bizId, staffDeviceId: other.deviceId }),
      (e: unknown) => e instanceof ReferralError && e.code === "NOT_FOUND",
    );
    await assert.rejects(
      redeemReward({ rewardId, businessId: s.bizId }),
      (e: unknown) => e instanceof ReferralError && e.code === "NO_STAFF",
    );
    await prisma.reward.update({
      where: { id: rewardId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await assert.rejects(
      redeemReward({ rewardId, businessId: s.bizId, staffDeviceId: s.deviceId }),
      (e: unknown) => e instanceof ReferralError && e.code === "EXPIRED",
    );
    assert.equal((await prisma.reward.findUniqueOrThrow({ where: { id: rewardId } })).status, "AVAILABLE");
  } finally {
    await cleanup(s.bizId);
    await cleanup(other.bizId);
  }
});

// ── Soegning og resultatkort ─────────────────────────────────────────

test("soegning: navn, mobil og kode, kun i egen butik", async () => {
  const s = await makeShop();
  const other = await makeShop();
  try {
    const sara = await makeCustomer(s, "Sara Jensen", "+4512345678");
    await makeCustomer(other, "Sara Fremmed", "+4587654321");
    const byName = await searchDeskCustomers(s.bizId, "sara");
    assert.deepEqual(byName.map((h) => h.id), [sara.id]);
    assert.deepEqual((await searchDeskCustomers(s.bizId, "5678")).map((h) => h.id), [sara.id]);
    assert.deepEqual((await searchDeskCustomers(s.bizId, sara.code.toLowerCase())).map((h) => h.id), [sara.id]);
    assert.deepEqual(await searchDeskCustomers(s.bizId, "87654321"), []);
  } finally {
    await cleanup(s.bizId);
    await cleanup(other.bizId);
  }
});

test("resultatkort: aaben henvisning, kan ikke kobles igen, scan af fremmed kort giver intet", async () => {
  const s = await makeShop();
  const other = await makeShop();
  try {
    const sara = await makeCustomer(s, "Sara", "+4511111111");
    const mikkel = await makeCustomer(s, "Mikkel", "+4522222222");
    const fresh = await getDeskCustomer(s.bizId, { serial: mikkel.serial });
    assert.ok(fresh);
    assert.equal(fresh.canLink, true);
    assert.equal(fresh.openReferral, null);

    await createReferral({
      businessId: s.bizId,
      referrerCardId: sara.id,
      referredCardId: mikkel.id,
      source: "MANUAL_AT_DESK",
    });
    const linked = await getDeskCustomer(s.bizId, { cardId: mikkel.id });
    assert.ok(linked?.openReferral);
    assert.equal(linked.openReferral.referrerName, "Sara");
    assert.equal(linked.openReferral.stale, false);
    assert.equal(linked.canLink, false);

    assert.equal(await getDeskCustomer(other.bizId, { serial: mikkel.serial }), null);
  } finally {
    await cleanup(s.bizId);
    await cleanup(other.bizId);
  }
});

test("resultatkort efter foerste besoeg: beloenninger til gode, ingen aaben henvisning", async () => {
  const s = await makeShop();
  try {
    const { sara, mikkel } = await rewardedPair(s);
    const m = await getDeskCustomer(s.bizId, { cardId: mikkel.id });
    assert.equal(m?.openReferral, null);
    assert.deepEqual(m?.rewards.map((r) => r.value), ["100"]);
    const sv = await getDeskCustomer(s.bizId, { cardId: sara.id });
    assert.deepEqual(sv?.rewards.map((r) => r.value), ["50"]);
    assert.equal(sv?.referralsDone, 1);
  } finally {
    await cleanup(s.bizId);
  }
});

// ── Dashboardet ──────────────────────────────────────────────────────

test("dashboard: aabne, gennemfoerte denne maaned, til gode og top-ambassadoerer", async () => {
  const s = await makeShop();
  try {
    const { sara, visit } = await rewardedPair(s);
    // En aaben henvisning mere fra Sara.
    const ny = await makeCustomer(s, "Ny", "+4533333333");
    await createReferral({ businessId: s.bizId, referrerCardId: sara.id, referredCardId: ny.id, source: "LINK" });
    // Mikkels 100 kr. indloeses; Saras 50 kr. venter.
    await redeemReward({
      rewardId: visit.rewards.find((r) => r.role === "newCustomer")!.id,
      businessId: s.bizId,
      staffDeviceId: s.deviceId,
    });

    const o = await getReferralOverview(s.bizId);
    assert.equal(o.open, 1);
    assert.equal(o.doneThisMonth, 1);
    assert.equal(o.pendingRewards, 1);
    assert.equal(o.pendingAmountKr, 50);
    assert.equal(o.recent.length, 2);
    assert.deepEqual(o.topAmbassadors.map((a) => [a.name, a.referrals]), [["Sara Jensen", 1]]);

    const rows = await referralExportRows(s.bizId);
    const saraRow = rows.find((r) => r.code === sara.code)!;
    assert.equal(saraRow.referralsDone, 1);
    assert.equal(saraRow.rewardsAvailable, 1);
    assert.equal(rows.find((r) => r.name === "Mikkel Holm")?.referredBy, sara.code);
  } finally {
    await cleanup(s.bizId);
  }
});
