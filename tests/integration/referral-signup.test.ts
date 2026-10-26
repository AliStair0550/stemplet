import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Integrationstests for henvisningssidens tilmelding mod en RIGTIG Postgres
// (samme opsaetning som locks.test.ts). Fokus: eet kort pr. kunde, de aftalte
// regler for kendte kunder og mobilnumre, og at Stemplet er uroert (ingen
// stempler gives, butikker uden modulet kan ikke tilmeldes).

import { prisma } from "../../src/lib/prisma";
import { saveReferralRule } from "../../src/lib/referral";
import { signupForReferrals } from "../../src/lib/referral-signup";

// Prisma indlaeser .env ved import; testene maa aldrig ramme en rigtig Redis.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

after(async () => {
  await prisma.$disconnect();
});

async function makeShop(opts?: { enabled?: boolean; rule?: boolean }) {
  const biz = await prisma.business.create({
    data: {
      name: "IT-kundeside",
      slug: `it-side-${randomUUID()}`,
      referralsEnabled: opts?.enabled ?? true,
      cards: { create: { rewardText: "Gratis klip" } },
    },
    include: { cards: true },
  });
  if (opts?.rule ?? true) {
    await saveReferralRule(biz.id, {
      newCustomerRewardType: "AMOUNT",
      newCustomerRewardValue: "100",
      referrerRewardType: "AMOUNT",
      referrerRewardValue: "100",
    });
  }
  return { bizId: biz.id, slug: biz.slug, cardId: biz.cards[0]!.id };
}

async function cleanup(bizId: string) {
  await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
}

const device = () => `dev-${randomUUID()}`;

test("ny kunde uden kode: eet almindeligt kort med navn, mobil og kode, ingen stempler", async () => {
  const s = await makeShop();
  try {
    const r = await signupForReferrals({ slug: s.slug, name: " Sara  Jensen ", phone: "12 34 56 78", deviceId: device() });
    assert.ok(r.ok);
    assert.equal(r.referred, false);
    assert.match(r.code, /^SARA-..$/);
    const cards = await prisma.customerCard.findMany({ where: { cardId: s.cardId } });
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.name, "Sara Jensen");
    assert.equal(cards[0]!.phone, "+4512345678");
    assert.equal(cards[0]!.businessId, s.bizId);
    assert.equal(cards[0]!.stamps, 0);
    assert.equal(await prisma.stamp.count({ where: { customerCardId: cards[0]!.id } }), 0);
  } finally {
    await cleanup(s.bizId);
  }
});

test("ny kunde via kode: aaben henvisning (created) til henviseren", async () => {
  const s = await makeShop();
  try {
    const sara = await signupForReferrals({ slug: s.slug, name: "Sara", phone: "11111111", deviceId: device() });
    assert.ok(sara.ok);
    const mikkel = await signupForReferrals({
      slug: s.slug,
      name: "Mikkel",
      phone: "22222222",
      code: sara.code.toLowerCase(),
      source: "CODE_ENTERED",
      deviceId: device(),
    });
    assert.ok(mikkel.ok);
    assert.equal(mikkel.referred, true);
    const ref = await prisma.referral.findFirstOrThrow({ where: { businessId: s.bizId } });
    assert.equal(ref.status, "CREATED");
    assert.equal(ref.source, "CODE_ENTERED");
    // Ingen beloenninger endnu: de opstaar foerst ved kassen (fase 3).
    assert.equal(await prisma.reward.count({ where: { businessId: s.bizId } }), 0);
  } finally {
    await cleanup(s.bizId);
  }
});

test("kendt kunde paa enheden via en vens kode: genbruger kortet, ingen henvisning", async () => {
  const s = await makeShop();
  try {
    const sara = await signupForReferrals({ slug: s.slug, name: "Sara", phone: "11111111", deviceId: device() });
    assert.ok(sara.ok);
    const dev = device();
    const first = await signupForReferrals({ slug: s.slug, name: "Mette", phone: "33333333", deviceId: dev });
    assert.ok(first.ok);
    const again = await signupForReferrals({
      slug: s.slug,
      name: "Mette",
      phone: "33333333",
      code: sara.code,
      deviceId: dev,
    });
    assert.ok(again.ok);
    assert.equal(again.alreadyCustomer, true);
    assert.equal(again.referred, false);
    assert.equal(again.code, first.code);
    assert.equal(await prisma.referral.count({ where: { businessId: s.bizId } }), 0);
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 2);
  } finally {
    await cleanup(s.bizId);
  }
});

test("eksisterende stempelkunde (kort uden navn/mobil) faar sin kode paa samme kort", async () => {
  const s = await makeShop();
  try {
    const authToken = randomUUID();
    const stampCard = await prisma.customerCard.create({
      data: { cardId: s.cardId, serial: randomUUID().slice(0, 12), authToken, stamps: 4 },
    });
    const r = await signupForReferrals({
      slug: s.slug,
      name: "Ole",
      phone: "44444444",
      cardTokenFor: () => authToken,
      deviceId: device(),
    });
    assert.ok(r.ok);
    assert.equal(r.created, false);
    const after = await prisma.customerCard.findUniqueOrThrow({ where: { id: stampCard.id } });
    assert.equal(after.stamps, 4, "stemplerne er uroerte");
    assert.equal(after.phone, "+4544444444");
    assert.equal(after.referralCode, r.code);
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("mobilnummer der tilhoerer et andet kort: afvist, intet nyt kort, intet afsloeret", async () => {
  const s = await makeShop();
  try {
    await signupForReferrals({ slug: s.slug, name: "Sara", phone: "+45 11 11 11 11", deviceId: device() });
    const r = await signupForReferrals({ slug: s.slug, name: "Fremmed", phone: "11111111", deviceId: device() });
    assert.deepEqual(r, { ok: false, error: "mobil_findes" });
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("to samtidige tilmeldinger med samme mobil: praecis eet kort faar nummeret", async () => {
  const s = await makeShop();
  try {
    const results = await Promise.all(
      [device(), device()].map((d) =>
        signupForReferrals({ slug: s.slug, name: "Tvilling", phone: "55555555", deviceId: d }),
      ),
    );
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(
      await prisma.customerCard.count({ where: { businessId: s.bizId, phone: "+4555555555" } }),
      1,
    );
  } finally {
    await cleanup(s.bizId);
  }
});

test("butik uden modulet eller uden regel: ingen tilmelding, intet kort", async () => {
  const off = await makeShop({ enabled: false });
  const noRule = await makeShop({ rule: false });
  try {
    for (const s of [off, noRule]) {
      const r = await signupForReferrals({ slug: s.slug, name: "Sara", phone: "12345678", deviceId: device() });
      assert.deepEqual(r, { ok: false, error: "lukket" });
      assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 0);
    }
  } finally {
    await cleanup(off.bizId);
    await cleanup(noRule.bizId);
  }
});

test("ugyldigt navn eller nummer afvises foer databasen", async () => {
  assert.deepEqual(
    await signupForReferrals({ slug: "findes-ikke", name: "  ", phone: "12345678" }),
    { ok: false, error: "navn" },
  );
  assert.deepEqual(
    await signupForReferrals({ slug: "findes-ikke", name: "Sara", phone: "123" }),
    { ok: false, error: "mobil" },
  );
});
