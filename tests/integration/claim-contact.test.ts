import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// "Hent mit stempelkort" med navn og e-mail mod en RIGTIG Postgres: et nyt kort
// kraever kontaktdata, en returkunde genfindes uden, intet overskrives, og een
// e-mail giver hoejst eet kort pr. butik.

import { prisma } from "../../src/lib/prisma";
import { resolveOrCreateCard } from "../../src/lib/claim";

// Prisma indlaeser .env ved import; testene maa aldrig ramme en rigtig Redis.
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

after(async () => {
  await prisma.$disconnect();
});

// Ingen request her, saa ingen kort-cookie: kun enheds-id'et genfinder kortet.
const noCookie = async () => undefined;
const device = () => `dev-${randomUUID()}`;

async function makeShop() {
  const biz = await prisma.business.create({
    data: {
      name: "IT-claim",
      slug: `it-claim-${randomUUID()}`,
      cards: { create: { rewardText: "Gratis kaffe" } },
    },
    include: { cards: true },
  });
  return { bizId: biz.id, slug: biz.slug, cardId: biz.cards[0]!.id };
}

async function cleanup(bizId: string) {
  await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
}

test("ny kunde uden navn og e-mail: intet kort, send til formularen", async () => {
  const s = await makeShop();
  try {
    const r = await resolveOrCreateCard(s.slug, device(), null, noCookie);
    assert.deepEqual(r, { ok: false, error: "kontakt" });
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 0);
  } finally {
    await cleanup(s.bizId);
  }
});

test("med kontakt oprettes kortet; Wallet-linket genfinder det uden kontakt", async () => {
  const s = await makeShop();
  try {
    const dev = device();
    const first = await resolveOrCreateCard(s.slug, dev, { name: "Sara", email: "sara@test.dk", consent: false }, noCookie);
    assert.ok(first.ok && first.created);
    const again = await resolveOrCreateCard(s.slug, dev, null, noCookie);
    assert.ok(again.ok);
    assert.equal(again.created, false);
    assert.equal(again.serial, first.serial);

    const cc = await prisma.customerCard.findFirstOrThrow({ where: { cardId: s.cardId } });
    assert.equal(cc.name, "Sara");
    assert.equal(cc.contactEmail, "sara@test.dk");
    assert.equal(cc.businessId, s.bizId);
    assert.equal(cc.marketingConsentAt, null);
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("samtykke gemmes med tidspunkt; udfyldte felter overskrives aldrig", async () => {
  const s = await makeShop();
  try {
    const dev = device();
    await resolveOrCreateCard(s.slug, dev, { name: "Sara", email: "sara@test.dk", consent: true }, noCookie);
    const r = await resolveOrCreateCard(s.slug, dev, { name: "Fremmed", email: "anden@test.dk", consent: false }, noCookie);
    assert.ok(r.ok && !r.created);
    const cc = await prisma.customerCard.findFirstOrThrow({ where: { cardId: s.cardId } });
    assert.equal(cc.name, "Sara");
    assert.equal(cc.contactEmail, "sara@test.dk");
    assert.ok(cc.marketingConsentAt);
  } finally {
    await cleanup(s.bizId);
  }
});

test("e-mail paa et andet kort i butikken: afvist, intet nyt kort", async () => {
  const s = await makeShop();
  try {
    await resolveOrCreateCard(s.slug, device(), { name: "Sara", email: "sara@test.dk", consent: false }, noCookie);
    const r = await resolveOrCreateCard(s.slug, device(), { name: "Sara", email: "sara@test.dk", consent: false }, noCookie);
    assert.deepEqual(r, { ok: false, error: "mail_findes" });
    assert.equal(await prisma.customerCard.count({ where: { cardId: s.cardId } }), 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("gammelt kort uden kontakt (returkunde) genfindes stadig med eet tryk", async () => {
  const s = await makeShop();
  try {
    const dev = device();
    const old = await prisma.customerCard.create({
      data: { cardId: s.cardId, serial: randomUUID().slice(0, 12), authToken: randomUUID(), deviceId: dev, stamps: 3 },
    });
    const r = await resolveOrCreateCard(s.slug, dev, null, noCookie);
    assert.ok(r.ok);
    assert.equal(r.serial, old.serial);
  } finally {
    await cleanup(s.bizId);
  }
});

// R5: dobbelttryk paa "Hent kort".
async function withPickupStamp(cardId: string) {
  const now = Date.now();
  await prisma.campaign.create({
    data: {
      cardId,
      type: "PICKUP_STAMP",
      startsAt: new Date(now - 60_000),
      endsAt: new Date(now + 3_600_000),
    },
  });
}

test("dobbelttryk fra samme telefon: eet kort og kun eet velkomststempel", async () => {
  const s = await makeShop();
  try {
    await withPickupStamp(s.cardId);
    const dev = device();
    const contact = { name: "Sara", email: "sara@test.dk", consent: false };
    const [a, b] = await Promise.all([
      resolveOrCreateCard(s.slug, dev, contact, noCookie),
      resolveOrCreateCard(s.slug, dev, contact, noCookie),
    ]);
    assert.ok(a.ok && b.ok);
    assert.equal(a.serial, b.serial);
    assert.equal([a.created, b.created].filter(Boolean).length, 1);
    const cards = await prisma.customerCard.findMany({ where: { cardId: s.cardId } });
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.stamps, 1);
  } finally {
    await cleanup(s.bizId);
  }
});

test("dobbelttryk fra en ny telefon (to enheds-id'er): intet tomt kort tilbage", async () => {
  const s = await makeShop();
  try {
    const contact = { name: "Sara", email: "sara@test.dk", consent: false };
    const results = await Promise.all([
      resolveOrCreateCard(s.slug, device(), contact, noCookie),
      resolveOrCreateCard(s.slug, device(), contact, noCookie),
    ]);
    assert.ok(results.some((r) => r.ok));
    const cards = await prisma.customerCard.findMany({ where: { cardId: s.cardId } });
    assert.equal(cards.length, 1);
    assert.equal(cards[0]!.contactEmail, "sara@test.dk");
  } finally {
    await cleanup(s.bizId);
  }
});

test("første stempel med det samme: nyt kort starter på 1, ellers 0", async () => {
  const s = await makeShop();
  try {
    const off = await resolveOrCreateCard(s.slug, device(), { name: "Uden", email: "uden@test.dk", consent: false }, noCookie);
    assert.ok(off.ok);
    assert.equal((await prisma.customerCard.findUnique({ where: { serial: off.serial } }))!.stamps, 0);

    await prisma.business.update({ where: { id: s.bizId }, data: { welcomeStampEnabled: true } });
    const on = await resolveOrCreateCard(s.slug, device(), { name: "Mette", email: "mette@test.dk", consent: false }, noCookie);
    assert.ok(on.ok && on.created);
    assert.equal((await prisma.customerCard.findUnique({ where: { serial: on.serial } }))!.stamps, 1);

    // Genfundet kort faar ikke et stempel til.
    const again = await resolveOrCreateCard(s.slug, device(), { name: "Mette", email: "mette@test.dk", consent: false }, noCookie);
    if (again.ok) assert.equal((await prisma.customerCard.findUnique({ where: { serial: on.serial } }))!.stamps, 1);
  } finally {
    await cleanup(s.bizId);
  }
});
