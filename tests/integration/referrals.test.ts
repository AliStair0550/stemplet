import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Integrationstests for henvisninger mod en RIGTIG Postgres (samme opsaetning som
// locks.test.ts). Promise.all kalder to $transaction'er paa hver sin connection,
// saa raekke-laasen, advisory-laasen og de guardede updates testes under aegte
// samtidighed. Redis er ikke sat op her, saa runOnce er fail-open, og det er
// databasen alene, der skal forhindre dobbelte beloenninger.

import { prisma } from "../../src/lib/prisma";
import {
  createReferral,
  recordFirstVisit,
  expireReferralsAndRewards,
  assignReferralCode,
  saveReferralRule,
  ReferralError,
} from "../../src/lib/referral";

// Prisma-klienten indlaeser .env ved import. Lokalt kan den indeholde en rigtig
// Upstash-Redis; den maa testene aldrig skrive til. Uden Redis er runOnce
// fail-open, praecis som i CI, saa det er databasen der beviser idempotensen.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

const DAY = 86_400_000;

async function makeBiz(opts?: { maxPerMonth?: number | null; expiryDays?: number }) {
  const biz = await prisma.business.create({
    data: {
      name: "IT-henvisning",
      slug: `it-ref-${randomUUID()}`,
      referralsEnabled: true,
      cards: { create: { rewardText: "Gratis klip" } },
      devices: { create: { name: "Kasse", tokenHash: randomUUID() } },
    },
    include: { cards: true, devices: true },
  });
  await saveReferralRule(biz.id, {
    newCustomerRewardType: "AMOUNT",
    newCustomerRewardValue: "100",
    referrerRewardType: "SERVICE",
    referrerRewardValue: "Gratis klip",
    maxReferralsPerMonth: opts?.maxPerMonth === undefined ? 5 : opts.maxPerMonth,
    rewardExpiryDays: opts?.expiryDays ?? 180,
  });
  return { bizId: biz.id, cardId: biz.cards[0]!.id, deviceId: biz.devices[0]!.id };
}

function makeCard(cardId: string, extra?: { name?: string; phone?: string }) {
  return prisma.customerCard.create({
    data: {
      cardId,
      serial: randomUUID().slice(0, 12),
      authToken: randomUUID(),
      ...extra,
    },
    select: { id: true },
  });
}

async function cleanup(bizId: string) {
  // Cascade sletter kort, kundekort, henvisninger, beloenninger og regel.
  await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
}

after(async () => {
  await prisma.$disconnect();
});

async function setup(opts?: { maxPerMonth?: number | null; expiryDays?: number }) {
  const biz = await makeBiz(opts);
  const referrer = await makeCard(biz.cardId);
  const referred = await makeCard(biz.cardId);
  const referral = await createReferral({
    businessId: biz.bizId,
    referrerCardId: referrer.id,
    referredCardId: referred.id,
    source: "LINK",
  });
  return { ...biz, referrer, referred, referral };
}

// ── created -> rewarded i een transaktion ────────────────────────────

test("foerste besoeg: created -> rewarded med to beloenninger fra reglen", async () => {
  const s = await setup();
  try {
    const now = new Date();
    const res = await recordFirstVisit({
      referralId: s.referral.id,
      businessId: s.bizId,
      staffDeviceId: s.deviceId,
      idempotencyKey: "k1",
      now,
    });
    assert.equal(res.status, "REWARDED");

    const r = await prisma.referral.findUniqueOrThrow({ where: { id: s.referral.id } });
    assert.equal(r.status, "REWARDED");
    assert.ok(r.visitedAt && r.rewardedAt);
    assert.equal(r.visitedByStaffDeviceId, s.deviceId);

    const rewards = await prisma.reward.findMany({ where: { referralId: r.id } });
    assert.equal(rewards.length, 2);
    const forNew = rewards.find((x) => x.cardId === s.referred.id)!;
    const forReferrer = rewards.find((x) => x.cardId === s.referrer.id)!;
    assert.deepEqual([forNew.type, forNew.value], ["AMOUNT", "100"]);
    assert.deepEqual([forReferrer.type, forReferrer.value], ["SERVICE", "Gratis klip"]);
    for (const x of rewards) {
      assert.equal(x.status, "AVAILABLE");
      assert.equal(x.expiresAt.getTime(), now.getTime() + 180 * DAY);
    }
    for (const x of res.rewards) {
      assert.equal(x.role, x.cardId === s.referred.id ? "newCustomer" : "referrer");
    }

    const card = await prisma.customerCard.findUniqueOrThrow({ where: { id: s.referred.id } });
    assert.equal(card.referredByCardId, s.referrer.id);
  } finally {
    await cleanup(s.bizId);
  }
});

// ── Dobbelttryk ──────────────────────────────────────────────────────

test("dobbelttryk med samme idempotency key: samme svar, kun to beloenninger", async () => {
  const s = await setup();
  try {
    const call = () =>
      recordFirstVisit({
        referralId: s.referral.id,
        businessId: s.bizId,
        staffDeviceId: s.deviceId,
        idempotencyKey: "tryk-1",
      });
    const first = await call();
    const again = await call();
    assert.deepEqual(again, first, "gentaget tryk giver praecis samme svar");

    // Og samtidigt med samme noegle (tabt svar + nyt tryk i samme oejeblik).
    const [a, b] = await Promise.all([call(), call()]);
    assert.deepEqual(a, first);
    assert.deepEqual(b, first);

    assert.equal(await prisma.reward.count({ where: { referralId: s.referral.id } }), 2);
  } finally {
    await cleanup(s.bizId);
  }
});

test("to samtidige kald paa samme henvisning: praecis eet lykkes, to beloenninger", async () => {
  const s = await setup();
  try {
    const results = await Promise.allSettled(
      ["a", "b"].map((k) =>
        recordFirstVisit({
          referralId: s.referral.id,
          businessId: s.bizId,
          staffDeviceId: s.deviceId,
          idempotencyKey: `samtidig-${k}`,
        }),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected");
    assert.equal(ok.length, 1);
    assert.equal(failed.length, 1);
    const err = (failed[0] as PromiseRejectedResult).reason;
    assert.ok(err instanceof ReferralError && err.code === "INVALID_TRANSITION");
    assert.equal(await prisma.reward.count({ where: { referralId: s.referral.id } }), 2);
  } finally {
    await cleanup(s.bizId);
  }
});

// ── Loftet ───────────────────────────────────────────────────────────

test("loft: to samtidige henvisninger fra samme henviser ved loftet giver een henviser-beloenning", async () => {
  const biz = await makeBiz({ maxPerMonth: 1 });
  try {
    const referrer = await makeCard(biz.cardId);
    const [n1, n2] = await Promise.all([makeCard(biz.cardId), makeCard(biz.cardId)]);
    const refs = [];
    for (const n of [n1, n2]) {
      refs.push(
        await createReferral({
          businessId: biz.bizId,
          referrerCardId: referrer.id,
          referredCardId: n.id,
          source: "CODE_ENTERED",
        }),
      );
    }
    await Promise.all(
      refs.map((r) =>
        recordFirstVisit({ referralId: r.id, businessId: biz.bizId, staffDeviceId: biz.deviceId }),
      ),
    );
    assert.equal(await prisma.reward.count({ where: { cardId: referrer.id } }), 1);
    // Begge nye kunder faar deres beloenning, og begge henvisninger er rewarded.
    assert.equal(await prisma.reward.count({ where: { cardId: { in: [n1.id, n2.id] } } }), 2);
    assert.equal(
      await prisma.referral.count({ where: { referrerCardId: referrer.id, status: "REWARDED" } }),
      2,
    );
  } finally {
    await cleanup(biz.bizId);
  }
});

test("loft taelles paa rewarded: aabne henvisninger blokerer ikke henviseren", async () => {
  const biz = await makeBiz({ maxPerMonth: 1 });
  try {
    const referrer = await makeCard(biz.cardId);
    const refs = [];
    for (let i = 0; i < 3; i++) {
      const n = await makeCard(biz.cardId);
      refs.push(
        await createReferral({
          businessId: biz.bizId,
          referrerCardId: referrer.id,
          referredCardId: n.id,
          source: "LINK",
        }),
      );
    }
    // Tre aabne (created) henvisninger, loft 1: den foerste gennemfoerte belonner stadig.
    await recordFirstVisit({ referralId: refs[2]!.id, businessId: biz.bizId, staffDeviceId: biz.deviceId });
    assert.equal(await prisma.reward.count({ where: { cardId: referrer.id } }), 1);
  } finally {
    await cleanup(biz.bizId);
  }
});

// ── Et kort kan kun have eet referred_by ─────────────────────────────

test("to samtidige henvisninger af samme kort: det foerste vinder", async () => {
  const biz = await makeBiz();
  try {
    const [a, b, target] = await Promise.all([
      makeCard(biz.cardId),
      makeCard(biz.cardId),
      makeCard(biz.cardId),
    ]);
    const results = await Promise.allSettled(
      [a, b].map((r) =>
        createReferral({
          businessId: biz.bizId,
          referrerCardId: r.id,
          referredCardId: target.id,
          source: "LINK",
        }),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    const err = (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason;
    assert.ok(err instanceof ReferralError && err.code === "ALREADY_REFERRED");
    assert.equal(await prisma.referral.count({ where: { referredCardId: target.id } }), 1);
  } finally {
    await cleanup(biz.bizId);
  }
});

test("selvhenvisning via samme mobil afvises i databasen-flowet", async () => {
  const biz = await makeBiz();
  try {
    const a = await makeCard(biz.cardId, { phone: "+4512345678" });
    const b = await makeCard(biz.cardId, { phone: "+4512345678" });
    await assert.rejects(
      createReferral({ businessId: biz.bizId, referrerCardId: a.id, referredCardId: b.id, source: "LINK" }),
      (e: unknown) => e instanceof ReferralError && e.code === "SELF_REFERRAL",
    );
    const card = await prisma.customerCard.findUniqueOrThrow({ where: { id: b.id } });
    assert.equal(card.referredByCardId, null);
  } finally {
    await cleanup(biz.bizId);
  }
});

// ── Udloeb via cron ──────────────────────────────────────────────────

test("cron: gammel aaben henvisning og passeret beloenning udloeber, resten roeres ikke", async () => {
  const s = await setup({ expiryDays: 30 });
  try {
    const now = new Date();
    // En gammel aaben henvisning (31 dage) og en frisk (setup'ens).
    const oldCard = await makeCard(s.cardId);
    const old = await createReferral({
      businessId: s.bizId,
      referrerCardId: s.referrer.id,
      referredCardId: oldCard.id,
      source: "LINK",
    });
    await prisma.referral.update({
      where: { id: old.id },
      data: { createdAt: new Date(now.getTime() - 31 * DAY) },
    });
    // En udloebet og en gyldig beloenning.
    const expired = await prisma.reward.create({
      data: {
        businessId: s.bizId,
        cardId: s.referrer.id,
        type: "AMOUNT",
        value: "50",
        expiresAt: new Date(now.getTime() - 1000),
      },
    });
    const valid = await prisma.reward.create({
      data: {
        businessId: s.bizId,
        cardId: s.referrer.id,
        type: "AMOUNT",
        value: "50",
        expiresAt: new Date(now.getTime() + DAY),
      },
    });

    const res = await expireReferralsAndRewards(now);
    assert.ok(res.referralsExpired >= 1);
    assert.ok(res.rewardsExpired >= 1);
    // Kortet med den udloebne beloenning skal opdateres i Wallet.
    assert.ok(res.cardIds.includes(s.referrer.id), "beroert kort returneres");

    const statusOf = async (id: string) =>
      (await prisma.referral.findUniqueOrThrow({ where: { id } })).status;
    assert.equal(await statusOf(old.id), "EXPIRED");
    assert.equal(await statusOf(s.referral.id), "CREATED");
    assert.equal((await prisma.reward.findUniqueOrThrow({ where: { id: expired.id } })).status, "EXPIRED");
    assert.equal((await prisma.reward.findUniqueOrThrow({ where: { id: valid.id } })).status, "AVAILABLE");

    // En udloebet henvisning kan ikke gennemfoeres bagefter.
    await assert.rejects(
      recordFirstVisit({ referralId: old.id, businessId: s.bizId, staffDeviceId: s.deviceId }),
      (e: unknown) => e instanceof ReferralError && e.code === "INVALID_TRANSITION",
    );

    // Idempotent: anden koersel rammer ikke de samme raekker igen.
    await expireReferralsAndRewards(now);
    assert.equal((await prisma.reward.findUniqueOrThrow({ where: { id: valid.id } })).status, "AVAILABLE");
  } finally {
    await cleanup(s.bizId);
  }
});

test("for gammel henvisning som cron endnu ikke har set, afvises ved kassen", async () => {
  const s = await setup({ expiryDays: 30 });
  try {
    await prisma.referral.update({
      where: { id: s.referral.id },
      data: { createdAt: new Date(Date.now() - 31 * DAY) },
    });
    await assert.rejects(
      recordFirstVisit({ referralId: s.referral.id, businessId: s.bizId, staffDeviceId: s.deviceId }),
      (e: unknown) => e instanceof ReferralError && e.code === "EXPIRED",
    );
    assert.equal(await prisma.reward.count({ where: { referralId: s.referral.id } }), 0);
  } finally {
    await cleanup(s.bizId);
  }
});

// ── Kode unik pr. butik ──────────────────────────────────────────────

test("kode: to kunder med samme navn i samme butik faar forskellige koder", async () => {
  const biz = await makeBiz();
  try {
    const a = await makeCard(biz.cardId);
    const b = await makeCard(biz.cardId);
    // Tvungen kollision: rand giver samme endelse foerste gang for begge.
    const seq = (vals: number[]) => {
      let i = 0;
      return () => vals[Math.min(i++, vals.length - 1)]!;
    };
    const codeA = await assignReferralCode({ customerCardId: a.id, name: "Sara" }, prisma, seq([0, 0]));
    const codeB = await assignReferralCode({ customerCardId: b.id, name: "Sara" }, prisma, seq([0, 0, 1, 1]));
    assert.equal(codeA, "SARA-AA");
    assert.equal(codeB, "SARA-BB");
    const card = await prisma.customerCard.findUniqueOrThrow({ where: { id: b.id } });
    assert.equal(card.businessId, biz.bizId);
    assert.equal(card.name, "Sara");
  } finally {
    await cleanup(biz.bizId);
  }
});

// ── R19: slettet henviser ────────────────────────────────────────────

test("slettes henviserens kort, bliver henvisningen; vennen kan ikke henvises igen", async () => {
  const s = await setup();
  try {
    await prisma.customerCard.delete({ where: { id: s.referrer.id } });
    const r = await prisma.referral.findUniqueOrThrow({ where: { id: s.referral.id } });
    assert.equal(r.referrerCardId, null);

    // Besoeget gennemfoeres stadig: vennen faar sin rabat, ingen henviser-beloenning.
    const res = await recordFirstVisit({
      referralId: s.referral.id,
      businessId: s.bizId,
      staffDeviceId: s.deviceId,
      idempotencyKey: "slettet-1",
    });
    assert.equal(res.status, "REWARDED");
    const rewards = await prisma.reward.findMany({ where: { referralId: r.id } });
    assert.deepEqual(rewards.map((x) => x.cardId), [s.referred.id]);

    // En ny henviser kan ikke henvise den samme ven igen.
    const other = await makeCard(s.cardId);
    await assert.rejects(
      createReferral({ businessId: s.bizId, referrerCardId: other.id, referredCardId: s.referred.id, source: "LINK" }),
    );
  } finally {
    await cleanup(s.bizId);
  }
});

test("cron: med Henvisninger slaaet fra udloeber intet (ligger klar, naar det slaas til)", async () => {
  const s = await setup({ expiryDays: 30 });
  try {
    const now = new Date();
    await prisma.referral.update({ where: { id: s.referral.id }, data: { createdAt: new Date(now.getTime() - 31 * DAY) } });
    const reward = await prisma.reward.create({
      data: { businessId: s.bizId, cardId: s.referrer.id, type: "AMOUNT", value: "50", expiresAt: new Date(now.getTime() - DAY) },
    });
    await prisma.business.update({ where: { id: s.bizId }, data: { referralsEnabled: false } });
    await expireReferralsAndRewards(now);
    assert.equal((await prisma.referral.findUniqueOrThrow({ where: { id: s.referral.id } })).status, "CREATED");
    assert.equal((await prisma.reward.findUniqueOrThrow({ where: { id: reward.id } })).status, "AVAILABLE");
  } finally {
    await cleanup(s.bizId);
  }
});
