import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Integrationstests for henvisningssidens tilmelding mod en RIGTIG Postgres
// (samme opsaetning som locks.test.ts). Fokus: eet kort pr. kunde, de aftalte
// regler for kendte kunder og e-mails, og at Stemplet er uroert (ingen
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

test("ny kunde uden kode: eet almindeligt kort med navn, e-mail og kode, ingen stempler", async () => {
  const s = await makeShop();
  try {
    const r = await signupForReferrals({ slug: s.slug, name: " Sara  Jensen ", email: " Sara@Eksempel.DK ", deviceId: device() });
    assert.ok(r.ok);
    assert.equal(r.referred, false);
    assert.match(r.code, /^SARA-..$/);
    const cards = await prisma.customerCard.findMany({ where: { cardId: s.cardId } });
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.name, "Sara Jensen");
    assert.equal(cards[0]!.contactEmail, "sara@eksempel.dk");
    assert.equal(cards[0]!.marketingConsentAt, null, "intet flueben, intet samtykke");
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
    const sara = await signupForReferrals({ slug: s.slug, name: "Sara", email: "sara@test.dk", deviceId: device() });
    assert.ok(sara.ok);
    const mikkel = await signupForReferrals({
      slug: s.slug,
      name: "Mikkel",
      email: "mikkel@test.dk",
      consent: true,
      code: sara.code.toLowerCase(),
      source: "CODE_ENTERED",
      deviceId: device(),
    });
    assert.ok(mikkel.ok);
    assert.equal(mikkel.referred, true);
    const mCard = await prisma.customerCard.findFirstOrThrow({ where: { contactEmail: "mikkel@test.dk", businessId: s.bizId } });
    assert.ok(mCard.marketingConsentAt, "fluebenet gemmer samtykket med tidspunkt");
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
    const sara = await signupForReferrals({ slug: s.slug, name: "Sara", email: "sara@test.dk", deviceId: device() });
    assert.ok(sara.ok);
    const dev = device();
    const first = await signupForReferrals({ slug: s.slug, name: "Mette", email: "mette@test.dk", deviceId: dev });
    assert.ok(first.ok);
    const again = await signupForReferrals({
      slug: s.slug,
      name: "Mette",
      email: "mette@test.dk",
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

test("eksisterende stempelkunde (kort uden navn/e-mail) faar sin kode paa samme kort", async () => {
  const s = await makeShop();
  try {
    const authToken = randomUUID();
    const stampCard = await prisma.customerCard.create({
      data: { cardId: s.cardId, serial: randomUUID().slice(0, 12), authToken, stamps: 4 },
    });
    const r = await signupForReferrals({
      slug: s.slug,
      name: "Ole",
      email: "ole@test.dk",
      cardTokenFor: () => authToken,
      deviceId: device(),
    });
    assert.ok(r.ok);
    assert.equal(r.created, false);
    const after = await prisma.customerCard.findUniqueOrThrow({ where: { id: stampCard.id } });
    assert.equal(after.stamps, 4, "stemplerne er uroerte");
    assert.equal(after.contactEmail, "ole@test.dk");
    assert.equal(after.name, "Ole");
    assert.equal(after.referralCode, r.code);
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("e-mail der tilhoerer et andet kort: afvist, intet nyt kort, intet afsloeret", async () => {
  const s = await makeShop();
  try {
    await signupForReferrals({ slug: s.slug, name: "Sara", email: "sara@test.dk", deviceId: device() });
    const r = await signupForReferrals({ slug: s.slug, name: "Fremmed", email: " SARA@test.dk", deviceId: device() });
    assert.deepEqual(r, { ok: false, error: "mail_findes" });
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("to samtidige tilmeldinger med samme e-mail: praecis eet kort faar e-mailen", async () => {
  const s = await makeShop();
  try {
    const results = await Promise.all(
      [device(), device()].map((d) =>
        signupForReferrals({ slug: s.slug, name: "Tvilling", email: "tvilling@test.dk", deviceId: d }),
      ),
    );
    assert.equal(results.filter((r) => r.ok).length, 1);
    assert.equal(
      await prisma.customerCard.count({ where: { businessId: s.bizId, contactEmail: "tvilling@test.dk" } }),
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
      const r = await signupForReferrals({ slug: s.slug, name: "Sara", email: "sara@test.dk", deviceId: device() });
      assert.deepEqual(r, { ok: false, error: "lukket" });
      assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 0);
    }
  } finally {
    await cleanup(off.bizId);
    await cleanup(noRule.bizId);
  }
});

test("ugyldigt navn eller e-mail afvises foer databasen", async () => {
  assert.deepEqual(
    await signupForReferrals({ slug: "findes-ikke", name: "  ", email: "sara@test.dk" }),
    { ok: false, error: "navn" },
  );
  assert.deepEqual(
    await signupForReferrals({ slug: "findes-ikke", name: "Sara", email: "sara@" }),
    { ok: false, error: "mail" },
  );
});
