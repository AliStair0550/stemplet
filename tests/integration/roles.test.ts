import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

// Roller mod en RIGTIG Postgres: dashboardet ser kun butikker, man ejer;
// kassen ser ogsaa dem, man er medarbejder i; og en butik kan aldrig miste
// sin sidste med adgang til alt.

import type { MemberRole } from "@prisma/client";
import { prisma } from "../../src/lib/prisma";
import {
  changeMemberRole,
  MemberError,
  removeMember,
  resolveKasseBusiness,
  resolveOwnerBusinessId,
} from "../../src/lib/membership";

const businesses: string[] = [];

after(async () => {
  await prisma.business.deleteMany({ where: { id: { in: businesses } } });
  await prisma.$disconnect();
});

async function shop(name: string) {
  const b = await prisma.business.create({ data: { name, slug: `it-rolle-${randomUUID()}` } });
  businesses.push(b.id);
  return b.id;
}

async function user(homeBusinessId: string) {
  const u = await prisma.user.create({
    data: { email: `it-rolle-${randomUUID()}@test.local`, businessId: homeBusinessId },
  });
  return u.id;
}

async function member(userId: string, businessId: string, role: MemberRole) {
  await prisma.membership.create({ data: { userId, businessId, role } });
  // createdAt skal adskille sig, saa "foerste" er entydig.
  await new Promise((r) => setTimeout(r, 5));
}

async function roleOf(userId: string, businessId: string) {
  const m = await prisma.membership.findUnique({ where: { userId_businessId: { userId, businessId } } });
  return m?.role ?? null;
}

test("dashboard: kun OWNER-butikker, aeldste foerst, cookie vaelger blandt dem", async () => {
  const a = await shop("IT Rolle A");
  const b = await shop("IT Rolle B");
  const staffShop = await shop("IT Rolle Staff");
  const u = await user(a);
  await member(u, staffShop, "STAFF");
  await member(u, a, "OWNER");
  await member(u, b, "OWNER");

  assert.equal(await resolveOwnerBusinessId(u, undefined), a, "aeldste ejede butik");
  assert.equal(await resolveOwnerBusinessId(u, b), b, "cookie til en ejet butik");
  assert.equal(await resolveOwnerBusinessId(u, staffShop), a, "STAFF-butik i cookie ignoreres");
  assert.equal(await resolveOwnerBusinessId(u, "findes-ikke"), a, "ukendt cookie ignoreres");
});

test("dashboard: kun medarbejder giver ingen butik", async () => {
  const s = await shop("IT Rolle Kun Staff");
  const u = await user(s);
  await member(u, s, "STAFF");
  assert.equal(await resolveOwnerBusinessId(u, undefined), null);
  assert.equal(await resolveOwnerBusinessId(u, s), null);
});

test("kasse: kun medarbejder kommer ind som STAFF", async () => {
  const s = await shop("IT Kasse Staff");
  const u = await user(s);
  await member(u, s, "STAFF");
  assert.deepEqual(await resolveKasseBusiness(u, undefined, null), { businessId: s, role: "STAFF" });
});

test("kasse: ejer + medarbejder, ejet butik som standard, cookie skifter til STAFF", async () => {
  const own = await shop("IT Kasse Egen");
  const other = await shop("IT Kasse Anden");
  const fremmed = await shop("IT Kasse Fremmed");
  const u = await user(own);
  await member(u, own, "OWNER");
  await member(u, other, "STAFF");

  assert.deepEqual(await resolveKasseBusiness(u, undefined, own), { businessId: own, role: "OWNER" });
  assert.deepEqual(await resolveKasseBusiness(u, other, own), { businessId: other, role: "STAFF" });
  assert.deepEqual(
    await resolveKasseBusiness(u, fremmed, own),
    { businessId: own, role: "OWNER" },
    "cookie til en butik uden adgang ignoreres",
  );
});

test("kasse: ingen adgang nogen steder giver null", async () => {
  const s = await shop("IT Kasse Ingen");
  const u = await user(s);
  assert.equal(await resolveKasseBusiness(u, s, null), null);
});

test("fjern adgang: medarbejder kan fjernes, sidste ejer kan ikke", async () => {
  const s = await shop("IT Fjern");
  const owner = await user(s);
  const staff = await user(s);
  await member(owner, s, "OWNER");
  await member(staff, s, "STAFF");

  await removeMember(s, staff);
  assert.equal(await roleOf(staff, s), null);

  await assert.rejects(removeMember(s, owner), (e) => e instanceof MemberError && /mindst én/.test(e.message));
  assert.equal(await roleOf(owner, s), "OWNER", "ejeren er der stadig");

  await assert.rejects(removeMember(s, staff), (e) => e instanceof MemberError && /ikke fundet/.test(e.message));
});

test("fjern adgang: en af to ejere kan fjernes", async () => {
  const s = await shop("IT Fjern To");
  const o1 = await user(s);
  const o2 = await user(s);
  await member(o1, s, "OWNER");
  await member(o2, s, "OWNER");
  await removeMember(s, o2);
  assert.equal(await roleOf(o2, s), null);
  assert.equal(await roleOf(o1, s), "OWNER");
});

test("skift rolle: op og ned, men sidste ejer kan ikke goeres til medarbejder", async () => {
  const s = await shop("IT Rolle Skift");
  const owner = await user(s);
  const staff = await user(s);
  await member(owner, s, "OWNER");
  await member(staff, s, "STAFF");

  await assert.rejects(
    changeMemberRole(s, owner, "STAFF"),
    (e) => e instanceof MemberError && /mindst én/.test(e.message),
  );
  assert.equal(await roleOf(owner, s), "OWNER");

  await changeMemberRole(s, staff, "OWNER");
  assert.equal(await roleOf(staff, s), "OWNER");
  await changeMemberRole(s, owner, "STAFF");
  assert.equal(await roleOf(owner, s), "STAFF", "nu er der en anden ejer");

  await changeMemberRole(s, staff, "OWNER"); // samme rolle: ingen fejl
  await assert.rejects(changeMemberRole(s, "findes-ikke", "OWNER"), MemberError);
});

test("samtidige nedgraderinger af to ejere efterlader altid mindst en ejer", async () => {
  const s = await shop("IT Rolle Samtidig");
  const o1 = await user(s);
  const o2 = await user(s);
  await member(o1, s, "OWNER");
  await member(o2, s, "OWNER");

  const results = await Promise.allSettled([changeMemberRole(s, o1, "STAFF"), changeMemberRole(s, o2, "STAFF")]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1, "praecis en lykkes");
  const owners = await prisma.membership.count({ where: { businessId: s, role: "OWNER" } });
  assert.equal(owners, 1);
});
