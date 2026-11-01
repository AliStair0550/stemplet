// Slet profil mod en AEGTE Postgres: butikker, hvor brugeren er alene, slettes;
// delte butikker beholdes, og kun brugerens adgang fjernes.
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "../../src/lib/prisma";
import { deleteUserProfile, soleBusinessesOf } from "../../src/lib/profile-delete";

const bizIds: string[] = [];
after(async () => {
  await prisma.business.deleteMany({ where: { id: { in: bizIds } } });
  await prisma.$disconnect();
});

async function biz(name: string) {
  const b = await prisma.business.create({ data: { name, slug: `it-profil-${randomUUID()}` } });
  bizIds.push(b.id);
  return b;
}

test("slet profil: egen butik slettes, delt butik beholdes", async () => {
  const own = await biz("Egen");
  const shared = await biz("Delt");
  const me = await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, businessId: own.id } });
  const other = await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, businessId: shared.id } });
  await prisma.membership.createMany({
    data: [
      { userId: me.id, businessId: own.id },
      { userId: me.id, businessId: shared.id },
      { userId: other.id, businessId: shared.id },
    ],
  });

  assert.deepEqual((await soleBusinessesOf(me.id)).map((b) => b.id), [own.id]);
  const slugs = await deleteUserProfile(me.id);
  assert.deepEqual(slugs, [own.slug]);

  assert.equal(await prisma.business.findUnique({ where: { id: own.id } }), null);
  assert.ok(await prisma.business.findUnique({ where: { id: shared.id } }));
  assert.equal(await prisma.user.findUnique({ where: { id: me.id } }), null);
  assert.ok(await prisma.user.findUnique({ where: { id: other.id } }));
  assert.equal(await prisma.membership.count({ where: { businessId: shared.id } }), 1);
});

test("slet profil: medarbejdere taeller ikke som ejere", async () => {
  const shop = await biz("Med personale");
  const owner = await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, businessId: shop.id } });
  const staff = await prisma.user.create({ data: { email: `${randomUUID()}@test.local`, businessId: shop.id } });
  await prisma.membership.createMany({
    data: [
      { userId: owner.id, businessId: shop.id },
      { userId: staff.id, businessId: shop.id, role: "STAFF" },
    ],
  });

  // Ejeren er eneste ejer, selvom der er en medarbejder: butikken slettes med.
  assert.deepEqual((await soleBusinessesOf(owner.id)).map((b) => b.id), [shop.id]);
  // En medarbejder ejer ingen butikker og sletter aldrig butikken.
  assert.deepEqual(await soleBusinessesOf(staff.id), []);
});
