import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Integrationstests mod en RIGTIG Postgres (se .github/workflows/ci.yml: en
// postgres-service + prisma migrate deploy). De verificerer laasene under AEGTE
// samtidighed: Promise.all kalder to $transaction'er, som Prisma koerer paa hver
// sin connection, saa FOR UPDATE / advisory-laas / guardede updateMany faktisk
// testes - ikke bare en model af dem. Koeres KUN via `npm run test:integration`,
// aldrig i den DB-loese `npm test`.

import { prisma } from "../../src/lib/prisma";
import {
  applyStamp,
  undoLastStamp,
  redeemReward,
  createCardholderAtomically,
} from "../../src/lib/stamp";
import { checkStampInvariant } from "../../src/lib/billing";
import { PLAN_LIMITS } from "../../src/lib/plans";

type Camp = { type: "DOUBLE_STAMP" | "WELCOME_BONUS"; startsAt: Date; endsAt: Date };

async function makeBiz(opts?: {
  stampsRequired?: number;
  welcome?: boolean;
}): Promise<{ bizId: string; cardId: string }> {
  const past = new Date(Date.now() - 86_400_000);
  const future = new Date(Date.now() + 86_400_000);
  const campaigns: Camp[] = [];
  if (opts?.welcome)
    campaigns.push({ type: "WELCOME_BONUS", startsAt: past, endsAt: future });
  const biz = await prisma.business.create({
    data: {
      name: "IT-test",
      slug: `it-${randomUUID()}`,
      staffPin: "x",
      cards: {
        create: {
          stampsRequired: opts?.stampsRequired ?? 10,
          rewardText: "Gratis kaffe",
          ...(campaigns.length ? { campaigns: { create: campaigns } } : {}),
        },
      },
    },
    include: { cards: true },
  });
  return { bizId: biz.id, cardId: biz.cards[0]!.id };
}

function makeCard(cardId: string) {
  return prisma.customerCard.create({
    data: {
      cardId,
      serial: randomUUID().slice(0, 12),
      authToken: randomUUID(),
    },
    select: { id: true },
  });
}

async function cleanup(bizId: string) {
  // Cascade sletter kort, kundekort, stempler, indloesninger, kampagner.
  await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
}

// Luk forbindelsen naar ALLE tests er koert, saa processen (og CI-jobbet) afslutter
// rent i stedet for at haenge paa en aaben Prisma-connection.
after(async () => {
  await prisma.$disconnect();
});

const stamp = (id: string) =>
  applyStamp({ customerCardId: id, method: "MANUAL", skipCooldown: true });

// ── DAT-2: undo maa aldrig tabe et samtidigt stempel ──────────────────

test("undo + samtidigt stempel: lifetimeStamps == sum(Stamp.multiplier)", async () => {
  const { bizId, cardId } = await makeBiz({ stampsRequired: 50 });
  const cc = await makeCard(cardId);
  try {
    for (let i = 0; i < 5; i++) await stamp(cc.id);

    // Rigtige parallelle operationer paa SAMME kort.
    await Promise.allSettled([
      undoLastStamp({ customerCardId: cc.id }),
      stamp(cc.id),
      undoLastStamp({ customerCardId: cc.id }),
      stamp(cc.id),
    ]);

    const fresh = await prisma.customerCard.findUnique({
      where: { id: cc.id },
      select: { lifetimeStamps: true },
    });
    const agg = await prisma.stamp.aggregate({
      where: { customerCardId: cc.id },
      _sum: { multiplier: true },
    });
    assert.equal(
      fresh!.lifetimeStamps,
      agg._sum.multiplier ?? 0,
      "invarianten holder: ingen lost update fra undo",
    );
  } finally {
    await cleanup(bizId);
  }
});

// ── DAT-3: kunde-loftet kan ikke races over graensen ──────────────────

test("kunde-loft: to samtidige tilmeldinger ved graensen giver praecis eet kort", async () => {
  const orig = PLAN_LIMITS.FREE.maxCustomers;
  PLAN_LIMITS.FREE.maxCustomers = 3;
  const { bizId, cardId } = await makeBiz();
  try {
    await makeCard(cardId); // 1
    await makeCard(cardId); // 2 (under loftet paa 3)

    const results = await Promise.all([
      createCardholderAtomically("FREE", bizId, cardId),
      createCardholderAtomically("FREE", bizId, cardId),
    ]);

    const created = results.filter(Boolean).length;
    const total = await prisma.customerCard.count({
      where: { card: { businessId: bizId } },
    });
    assert.equal(created, 1, "kun eet af to samtidige forsoeg lykkes ved loftet");
    assert.equal(total, 3, "loftet paa 3 blev IKKE overskredet");
  } finally {
    PLAN_LIMITS.FREE.maxCustomers = orig;
    await cleanup(bizId);
  }
});

// ── applyStamp: velkomstbonus gives kun EEN gang under samtidighed ─────

test("velkomstbonus: to samtidige foerste-stempler giver praecis EEN bonus", async () => {
  const { bizId, cardId } = await makeBiz({ stampsRequired: 50, welcome: true });
  const cc = await makeCard(cardId);
  try {
    await Promise.allSettled([stamp(cc.id), stamp(cc.id)]);

    const fresh = await prisma.customerCard.findUnique({
      where: { id: cc.id },
      select: { lifetimeStamps: true },
    });
    const agg = await prisma.stamp.aggregate({
      where: { customerCardId: cc.id },
      _sum: { multiplier: true },
    });
    // 2 basisstempler + 1 velkomstbonus = 3 (ikke 4).
    assert.equal(fresh!.lifetimeStamps, 3, "praecis EEN velkomstbonus (2 base + 1)");
    assert.equal(agg._sum.multiplier ?? 0, 3, "invarianten holder ogsaa her");
  } finally {
    await cleanup(bizId);
  }
});

// ── redeemReward: kun EEN indloesning paa et fuldt kort ────────────────

test("indloesning: to samtidige indloesninger paa fuldt kort giver praecis EEN", async () => {
  const { bizId, cardId } = await makeBiz({ stampsRequired: 5 });
  const cc = await makeCard(cardId);
  try {
    for (let i = 0; i < 5; i++) await stamp(cc.id); // fyld kortet

    const results = await Promise.allSettled([
      redeemReward({ customerCardId: cc.id }),
      redeemReward({ customerCardId: cc.id }),
    ]);

    const redemptions = await prisma.redemption.count({
      where: { customerCardId: cc.id },
    });
    const fresh = await prisma.customerCard.findUnique({
      where: { id: cc.id },
      select: { completedCount: true },
    });
    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    assert.equal(redemptions, 1, "kun EEN indloesning trods to samtidige forsoeg");
    assert.equal(fresh!.completedCount, 1);
    assert.equal(fulfilled, 1, "det andet forsoeg blev afvist");
  } finally {
    await cleanup(bizId);
  }
});

// ── Invariant-vagt: checkStampInvariant opdager en drift ──────────────

test("checkStampInvariant opdager en korrupt taeller", async () => {
  const { bizId, cardId } = await makeBiz();
  const cc = await makeCard(cardId);
  try {
    await stamp(cc.id); // lifetimeStamps=1 == sum(multiplier)=1
    const divergedBefore = (await checkStampInvariant()).diverged;

    // Korrupter taelleren manuelt (simulerer en drift, der slap igennem).
    await prisma.customerCard.update({
      where: { id: cc.id },
      data: { lifetimeStamps: 999 },
    });
    const divergedAfter = (await checkStampInvariant()).diverged;

    assert.ok(
      divergedAfter > divergedBefore,
      "invariant-checket opdager afvigelsen",
    );
  } finally {
    await cleanup(bizId);
  }
});

// ── Kun Henvisninger: Stemplet slaaet fra giver ingen stempler ─────────

test("stempling afvises, naar butikken har Stemplet slaaet fra", async () => {
  const { bizId, cardId } = await makeBiz();
  try {
    await prisma.business.update({ where: { id: bizId }, data: { stampsEnabled: false } });
    const cc = await makeCard(cardId);
    await assert.rejects(stamp(cc.id), (e: Error & { code?: string }) => e.code === "INACTIVE");
    const after = await prisma.customerCard.findUnique({ where: { id: cc.id }, select: { stamps: true } });
    assert.equal(after?.stamps, 0);
  } finally {
    await cleanup(bizId);
  }
});

// ── R10: kassens noegle i databasen (ingen Redis her) ─────────────────

test("samme noegle to gange samtidig: eet stempel, samme svar", async () => {
  const { bizId, cardId } = await makeBiz();
  try {
    const cc = await makeCard(cardId);
    const opts = { customerCardId: cc.id, method: "STAFF_SCAN" as const, skipCooldown: true, idempotencyKey: "tryk-123456" };
    const [a, b] = await Promise.all([applyStamp(opts), applyStamp(opts)]);
    assert.equal(a.stamps, 1);
    assert.equal(b.stamps, 1);
    // Et senere retry med samme noegle stempler heller ikke.
    const c = await applyStamp(opts);
    assert.equal(c.stamps, 1);
    assert.equal(await prisma.stamp.count({ where: { customerCardId: cc.id } }), 1);
    const row = await prisma.customerCard.findUniqueOrThrow({ where: { id: cc.id } });
    assert.equal(row.stamps, 1);
    assert.equal(row.lifetimeStamps, 1);
    // En ny noegle er et nyt stempel.
    await applyStamp({ ...opts, idempotencyKey: "tryk-654321" });
    assert.equal((await prisma.customerCard.findUniqueOrThrow({ where: { id: cc.id } })).stamps, 2);
  } finally {
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
  }
});

test("indloesning med samme noegle to gange: een indloesning, ingen fejl", async () => {
  const { bizId, cardId } = await makeBiz({ stampsRequired: 4 });
  try {
    const cc = await makeCard(cardId);
    await applyStamp({ customerCardId: cc.id, method: "STAFF_SCAN", skipCooldown: true, count: 4 });
    const opts = { customerCardId: cc.id, idempotencyKey: "indloes-123456" };
    const [a, b] = await Promise.all([redeemReward(opts), redeemReward(opts)]);
    assert.equal(a.completedCount, 1);
    assert.equal(b.completedCount, 1);
    const again = await redeemReward(opts);
    assert.equal(again.completedCount, 1);
    assert.equal(await prisma.redemption.count({ where: { customerCardId: cc.id } }), 1);
  } finally {
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
  }
});

test("fortryd med samme noegle to gange: kun eet stempel fjernes", async () => {
  const { bizId, cardId } = await makeBiz();
  try {
    const cc = await makeCard(cardId);
    for (let i = 0; i < 3; i++) await applyStamp({ customerCardId: cc.id, method: "STAFF_SCAN", skipCooldown: true });
    const opts = { customerCardId: cc.id, idempotencyKey: "fortryd-123456" };
    const [a, b] = await Promise.all([undoLastStamp(opts), undoLastStamp(opts)]);
    assert.equal(a.stamps, 2);
    assert.equal(b.stamps, 2);
    assert.equal((await prisma.customerCard.findUniqueOrThrow({ where: { id: cc.id } })).stamps, 2);
    assert.equal(await prisma.stamp.count({ where: { customerCardId: cc.id } }), 2);
  } finally {
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
  }
});

// ── Runde 2: fortryd efter indloesning og PIN-laas ───────────────────

test("fortryd efter indloesning afvises, og taellerne roeres ikke", async () => {
  const { bizId, cardId } = await makeBiz({ stampsRequired: 4 });
  try {
    const cc = await makeCard(cardId);
    // 3 stempler, saa +3: 6 af 4. Indloesning efterlader 2 i overskud.
    await applyStamp({ customerCardId: cc.id, method: "STAFF_SCAN", skipCooldown: true, count: 3 });
    await applyStamp({ customerCardId: cc.id, method: "STAFF_SCAN", skipCooldown: true, count: 3 });
    await redeemReward({ customerCardId: cc.id });
    const before = await prisma.customerCard.findUniqueOrThrow({ where: { id: cc.id } });
    assert.equal(before.stamps, 2);
    await assert.rejects(undoLastStamp({ customerCardId: cc.id }), /kan ikke fortrydes/);
    const after = await prisma.customerCard.findUniqueOrThrow({ where: { id: cc.id } });
    assert.equal(after.stamps, before.stamps);
    assert.equal(after.lifetimeStamps, before.lifetimeStamps);
    // Et nyt stempel efter indloesningen kan stadig fortrydes.
    await applyStamp({ customerCardId: cc.id, method: "STAFF_SCAN", skipCooldown: true });
    const undone = await undoLastStamp({ customerCardId: cc.id });
    assert.equal(undone.stamps, 2);
  } finally {
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
  }
});

test("PIN: mange samtidige gaet giver hoejst loftet, derefter laas", async () => {
  const { reservePinAttempt } = await import("../../src/lib/security");
  const { PIN_MAX_ATTEMPTS } = await import("../../src/lib/system-config");
  const { bizId } = await makeBiz();
  try {
    const results = await Promise.all(Array.from({ length: 20 }, () => reservePinAttempt(bizId, "ip-test")));
    assert.equal(results.filter(Boolean).length, PIN_MAX_ATTEMPTS);
    // Laast: ogsaa det naeste forsoeg afvises.
    assert.equal(await reservePinAttempt(bizId, "ip-test"), false);
  } finally {
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
  }
});
