import "server-only";
import { prisma } from "./prisma";
import { DEMO_SLUG } from "./demo";

type Db = typeof prisma;

/**
 * Butikker, der slettes sammen med profilen: dem, hvor brugeren er den eneste
 * ejer. Butikker med andre ejere beholdes (kun brugerens adgang fjernes).
 * Medarbejdere (kun kasse) taeller ikke: en butik uden ejer kan ingen styre.
 */
export async function soleBusinessesOf(userId: string, db: Db = prisma) {
  const memberships = await db.membership.findMany({
    where: { userId, role: "OWNER" },
    select: {
      business: {
        select: { id: true, name: true, slug: true, _count: { select: { memberships: { where: { role: "OWNER" } } } } },
      },
    },
  });
  return memberships.map((m) => m.business).filter((b) => b._count.memberships === 1);
}

/**
 * Slet en brugers profil: butikker, hvor brugeren er alene, slettes med alle
 * kort og kunder (cascade); i delte butikker fjernes kun adgangen. Til sidst
 * slettes brugeren. Demo-butikken roeres aldrig. Returnerer de slettede butikkers slugs.
 */
export async function deleteUserProfile(userId: string, db: Db = prisma): Promise<string[]> {
  const sole = (await soleBusinessesOf(userId, db)).filter((b) => b.slug !== DEMO_SLUG);
  await db.$transaction(async (tx) => {
    if (sole.length > 0) await tx.business.deleteMany({ where: { id: { in: sole.map((b) => b.id) } } });
    await tx.membership.deleteMany({ where: { userId } });
    // Brugeren kan allerede vaere vaek via sin primaere butik (cascade).
    await tx.user.deleteMany({ where: { id: userId } });
  });
  return sole.map((b) => b.slug);
}
