import type { MemberRole } from "@prisma/client";
import { prisma } from "./prisma";

// Medlemskaber og roller: hvilken butik et login ser, og regler for at aendre
// adgang. Ren databaselogik (uden cookies og session), saa den kan testes mod
// en rigtig database. lib/session og Medarbejdere bruger den.

type Db = typeof prisma;

/**
 * Butikken i dashboardet for et login: cookie-valget, hvis brugeren er EJER
 * dér, ellers brugerens foerste ejer-medlemskab. Medarbejder-medlemskaber
 * (STAFF) taeller aldrig, saa en medarbejder aldrig naar /app eller dets API'er.
 */
export async function resolveOwnerBusinessId(
  userId: string,
  wanted: string | undefined,
  db: Db = prisma,
): Promise<string | null> {
  if (wanted) {
    const m = await db.membership.findUnique({
      where: { userId_businessId: { userId, businessId: wanted } },
      select: { businessId: true, role: true },
    });
    if (m?.role === "OWNER") return m.businessId;
  }
  const first = await db.membership.findFirst({
    where: { userId, role: "OWNER" },
    select: { businessId: true },
    orderBy: { createdAt: "asc" },
  });
  return first?.businessId ?? null;
}

/**
 * Butikken i kassen for et login: som dashboardet, men medarbejder-medlemskaber
 * taeller ogsaa. ownerId er resultatet af resolveOwnerBusinessId (eller support).
 */
export async function resolveKasseBusiness(
  userId: string,
  wanted: string | undefined,
  ownerId: string | null,
  db: Db = prisma,
): Promise<{ businessId: string; role: "OWNER" | "STAFF" } | null> {
  if (wanted && wanted !== ownerId) {
    const m = await db.membership.findUnique({
      where: { userId_businessId: { userId, businessId: wanted } },
      select: { businessId: true, role: true },
    });
    if (m?.role === "STAFF") return { businessId: m.businessId, role: "STAFF" };
  }
  if (ownerId) return { businessId: ownerId, role: "OWNER" };
  const staff = await db.membership.findFirst({
    where: { userId, role: "STAFF" },
    select: { businessId: true },
    orderBy: { createdAt: "asc" },
  });
  return staff ? { businessId: staff.businessId, role: "STAFF" } : null;
}

/** En paen brugerfejl fra en aendring af adgang (transaktionen rulles tilbage). */
export class MemberError extends Error {}

/** Antal ejere, laest under en laas paa butikken (samtidige aendringer serialiseres). */
async function lockedOwnerCount(tx: Parameters<Parameters<Db["$transaction"]>[0]>[0], businessId: string) {
  await tx.$executeRaw`SELECT 1 FROM "Business" WHERE "id" = ${businessId} FOR UPDATE`;
  return tx.membership.count({ where: { businessId, role: "OWNER" } });
}

/** Fjern en persons adgang til butikken. En butik kan aldrig ende uden ejer. */
export async function removeMember(businessId: string, userId: string, db: Db = prisma): Promise<void> {
  await db.$transaction(async (tx) => {
    const owners = await lockedOwnerCount(tx, businessId);
    const membership = await tx.membership.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { id: true, role: true },
    });
    if (!membership) throw new MemberError("Adgangen blev ikke fundet.");
    if (membership.role === "OWNER" && owners <= 1) {
      throw new MemberError("Butikken skal have mindst én med adgang til alt.");
    }
    await tx.membership.delete({ where: { id: membership.id } });
  });
}

/** Skift en persons adgang. Den sidste ejer kan ikke goeres til medarbejder. */
export async function changeMemberRole(
  businessId: string,
  userId: string,
  role: MemberRole,
  db: Db = prisma,
): Promise<void> {
  await db.$transaction(async (tx) => {
    const owners = await lockedOwnerCount(tx, businessId);
    const membership = await tx.membership.findUnique({
      where: { userId_businessId: { userId, businessId } },
      select: { id: true, role: true },
    });
    if (!membership) throw new MemberError("Adgangen blev ikke fundet.");
    if (membership.role === role) return;
    if (membership.role === "OWNER" && owners <= 1) {
      throw new MemberError("Butikken skal have mindst én med adgang til alt.");
    }
    await tx.membership.update({ where: { id: membership.id }, data: { role } });
  });
}
