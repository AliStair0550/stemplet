// Gendan kortet med e-mail mod en AEGTE Postgres (samme opsaetning som de
// oevrige integrationstests). Mailen fanges af en falsk afsender.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { requestCardRecovery, redeemCardRecovery, recoveryTokenValid } from "../../src/lib/card-recovery";

const bizIds: string[] = [];
after(async () => {
  await prisma.business.deleteMany({ where: { id: { in: bizIds } } });
  await prisma.$disconnect();
});

async function setup() {
  const biz = await prisma.business.create({
    data: {
      name: "IT-gendan",
      slug: `it-gendan-${randomUUID()}`,
      staffPin: "x",
      cards: { create: { stampsRequired: 10, rewardText: "Gratis kaffe" } },
    },
    include: { cards: true },
  });
  bizIds.push(biz.id);
  const cardId = biz.cards[0]!.id;
  const cc = await prisma.customerCard.create({
    data: {
      cardId,
      businessId: biz.id,
      serial: randomUUID().slice(0, 12),
      authToken: randomUUID(),
      name: "Sara",
      contactEmail: "sara@test.local",
      deviceId: "gammel-telefon",
    },
  });
  return { biz, cardId, cc };
}

function mailer() {
  const sent: { to: string; text: string; fromName?: string }[] = [];
  const send = async (m: { to: string; text: string; fromName?: string }) => {
    sent.push(m);
    return true;
  };
  const token = () => /[?&]t=([A-Za-z0-9_-]+)/.exec(sent.at(-1)!.text)![1]!;
  return { sent, send: send as never, token };
}

test("ukendt e-mail: ingen mail, intet link", async () => {
  const { biz } = await setup();
  const m = mailer();
  assert.equal(await requestCardRecovery({ slug: biz.slug, email: "ukendt@test.local", baseUrl: "https://x" }, prisma, m.send), false);
  assert.equal(m.sent.length, 0);
});

test("kendt e-mail: link virker een gang og flytter kortet til den nye telefon", async () => {
  const { biz, cc } = await setup();
  const m = mailer();
  assert.equal(await requestCardRecovery({ slug: biz.slug, email: " SARA@test.local ", baseUrl: "https://x" }, prisma, m.send), true);
  assert.equal(m.sent[0]!.to, "sara@test.local");
  assert.equal(m.sent[0]!.fromName, "IT-gendan");
  const t = m.token();

  assert.equal(await recoveryTokenValid(t, biz.slug), true);
  // Link til en anden butiks side virker ikke (og bruges ikke op).
  assert.equal(await redeemCardRecovery(t, "en-anden-butik", "ny-telefon"), null);

  const r = await redeemCardRecovery(t, biz.slug, "ny-telefon");
  assert.equal(r?.id, cc.id);
  assert.equal(r?.authToken, cc.authToken);
  const after1 = await prisma.customerCard.findUnique({ where: { id: cc.id } });
  assert.equal(after1?.deviceId, "ny-telefon");

  assert.equal(await redeemCardRecovery(t, biz.slug, "tredje-telefon"), null);
  assert.equal(await recoveryTokenValid(t, biz.slug), false);
});

test("udloebet link virker ikke", async () => {
  const { biz } = await setup();
  const m = mailer();
  await requestCardRecovery({ slug: biz.slug, email: "sara@test.local", baseUrl: "https://x" }, prisma, m.send);
  await prisma.cardRecoveryToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) }, where: { customerCard: { card: { businessId: biz.id } } } });
  assert.equal(await redeemCardRecovery(m.token(), biz.slug, "ny"), null);
});

test("havde telefonen allerede et andet kort i butikken, vinder det gendannede", async () => {
  const { biz, cardId, cc } = await setup();
  const other = await prisma.customerCard.create({
    data: { cardId, serial: randomUUID().slice(0, 12), authToken: randomUUID(), deviceId: "ny-telefon" },
  });
  const m = mailer();
  await requestCardRecovery({ slug: biz.slug, email: "sara@test.local", baseUrl: "https://x" }, prisma, m.send);
  const r = await redeemCardRecovery(m.token(), biz.slug, "ny-telefon");
  assert.equal(r?.id, cc.id);
  assert.equal((await prisma.customerCard.findUnique({ where: { id: other.id } }))?.deviceId, null);
  assert.equal((await prisma.customerCard.findUnique({ where: { id: cc.id } }))?.deviceId, "ny-telefon");
});

test("genforsoeg fra samme telefon lige efter virker; anden telefon gor ikke", async () => {
  const { biz, cc } = await setup();
  const m = mailer();
  await requestCardRecovery({ slug: biz.slug, email: "sara@test.local", baseUrl: "https://x" }, prisma, m.send);
  const t = m.token();
  const [a, b] = await Promise.all([
    redeemCardRecovery(t, biz.slug, "samme-telefon"),
    redeemCardRecovery(t, biz.slug, "samme-telefon"),
  ]);
  assert.equal(a?.id, cc.id);
  assert.equal(b?.id, cc.id);
  assert.equal(await redeemCardRecovery(t, biz.slug, "samme-telefon").then((r) => r?.id), cc.id);
  assert.equal(await redeemCardRecovery(t, biz.slug, "anden-telefon"), null);
});
