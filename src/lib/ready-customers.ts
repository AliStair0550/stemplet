import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type ReadyCustomer = { id: string; serial: string; name: string | null; reasons: ("stamps" | "reward" | "visit")[] };

/**
 * Betingelserne for "venter paa noget ved kassen" (et af dem). Deles med
 * filteret "Klar til belønning" under Kunder, saa de altid taeller det samme.
 */
export function readyConditions(
  b: { stampsEnabled: boolean; referralsEnabled: boolean },
  card: { id: string; stampsRequired: number } | null,
  now: Date = new Date(),
): Prisma.CustomerCardWhereInput[] {
  const or: Prisma.CustomerCardWhereInput[] = [];
  if (b.stampsEnabled && card) or.push({ cardId: card.id, stamps: { gte: card.stampsRequired } });
  if (b.referralsEnabled) {
    or.push({ rewards: { some: { status: "AVAILABLE", expiresAt: { gt: now } } } });
    or.push({ referralReceived: { status: "CREATED" } });
  }
  return or;
}

/**
 * Kunder, der venter paa noget ved kassen: et fuldt stempelkort, en henvisnings-
 * beloenning klar eller et foerste besoeg via en ven. Til "Klar til belønning" paa Hjem.
 */
export async function getReadyCustomers(
  b: { id: string; stampsEnabled: boolean; referralsEnabled: boolean },
  take = 6,
  now: Date = new Date(),
): Promise<{ customers: ReadyCustomer[]; required: number }> {
  const card = await prisma.card.findFirst({
    where: { businessId: b.id, active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, stampsRequired: true },
  });
  const required = card?.stampsRequired ?? 10;
  const or = readyConditions(b, card, now);
  if (or.length === 0) return { customers: [], required };

  const rows = await prisma.customerCard.findMany({
    where: { card: { businessId: b.id }, OR: or },
    orderBy: [{ lastStampAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take,
    select: {
      id: true,
      serial: true,
      name: true,
      stamps: true,
      referralReceived: { select: { status: true } },
      _count: { select: { rewards: { where: { status: "AVAILABLE", expiresAt: { gt: now } } } } },
    },
  });
  return {
    required,
    customers: rows.map((r) => ({
      id: r.id,
      serial: r.serial,
      name: r.name,
      reasons: [
        ...(b.stampsEnabled && r.stamps >= required ? (["stamps"] as const) : []),
        ...(r._count.rewards > 0 ? (["reward"] as const) : []),
        ...(r.referralReceived?.status === "CREATED" ? (["visit"] as const) : []),
      ],
    })),
  };
}
