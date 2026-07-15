import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type PerDay = { date: string; label: string; weekday: string; count: number };

export type BusinessStats = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers30: number;
  newCustomers7: number;
  stampsToday: number;
  stampsWeek: number;
  stampsTotal: number;
  redemptionsTotal: number;
  redemptions30: number;
  revisitRate: number;
  completionRate: number;
  avgDaysToFull: number | null;
  byMethod: { kiosk: number; staff: number; manual: number };
  perDay: PerDay[];
  newPerDay: PerDay[];
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
export async function getBusinessStats(businessId: string): Promise<BusinessStats> {
  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);

  if (cardIds.length === 0) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers30: 0,
      newCustomers7: 0,
      stampsToday: 0,
      stampsWeek: 0,
      stampsTotal: 0,
      redemptionsTotal: 0,
      redemptions30: 0,
      revisitRate: 0,
      completionRate: 0,
      avgDaysToFull: null,
      byMethod: { kiosk: 0, staff: 0, manual: 0 },
      perDay: buildPerDay([]),
      newPerDay: buildPerDay([]),
    };
  }

  const d30 = daysAgo(30);
  const d60 = daysAgo(60);
  const rel = { customerCard: { cardId: { in: cardIds } } };
  const inCards = { cardId: { in: cardIds } };

  // Alt udregnes med aggregerede queries (count/groupBy/raw), saa vi ikke
  // laenger henter ALLE kundekort og ALLE indloesninger som fulde raekker for at
  // udlede en haandfuld tal (skalerer nu med indeks, ikke med kundetal).
  //
  // Genvej til "kunder med totalEver >= n": completedCount >= 1 medfoerer altid
  // totalEver >= required >= 4 >= 2, saa vi behoever ikke stampsRequired:
  //   atLeast1 = stamps >= 1 ELLER completedCount >= 1
  //   atLeast2 = stamps >= 2 ELLER completedCount >= 1
  const [
    totalCustomers,
    activeCustomers,
    newCustomers30,
    atLeast1,
    atLeast2,
    distinctRedeemers,
    stampsTotal,
    redemptionsTotal,
    redemptions30,
    recentStamps,
    recentCustomerCards,
    methodGroups,
    avgRows,
  ] = await Promise.all([
    prisma.customerCard.count({ where: inCards }),
    prisma.customerCard.count({
      where: { ...inCards, lastStampAt: { gte: d60 } },
    }),
    prisma.customerCard.count({
      where: { ...inCards, createdAt: { gte: d30 } },
    }),
    prisma.customerCard.count({
      where: {
        ...inCards,
        OR: [{ stamps: { gte: 1 } }, { completedCount: { gte: 1 } }],
      },
    }),
    prisma.customerCard.count({
      where: {
        ...inCards,
        OR: [{ stamps: { gte: 2 } }, { completedCount: { gte: 1 } }],
      },
    }),
    prisma.customerCard.count({
      where: { ...inCards, redemptions: { some: {} } },
    }),
    prisma.stamp.count({ where: rel }),
    prisma.redemption.count({ where: rel }),
    prisma.redemption.count({ where: { ...rel, createdAt: { gte: d30 } } }),
    prisma.stamp.findMany({
      where: { ...rel, createdAt: { gte: daysAgo(14) } },
      select: { createdAt: true },
    }),
    // Nye kundekort seneste 14 dage, saa vi kan tegne "nye kunder pr. dag".
    prisma.customerCard.findMany({
      where: { ...inCards, createdAt: { gte: daysAgo(14) } },
      select: { createdAt: true },
    }),
    prisma.stamp.groupBy({
      by: ["method"],
      where: rel,
      _count: { _all: true },
    }),
    // avgDaysToFull PR. CYKLUS: maal hver indloesning fra den FORRIGE indloesning
    // (eller kort-oprettelsen ved den foerste), ikke fra kortets oprettelse hver
    // gang. Ellers traekker loyale kunder tallet kunstigt op.
    prisma.$queryRaw<{ avg_days: number | null }[]>(Prisma.sql`
      SELECT AVG(days)::float8 AS avg_days FROM (
        SELECT EXTRACT(EPOCH FROM (r."createdAt" - COALESCE(
          LAG(r."createdAt") OVER (
            PARTITION BY r."customerCardId" ORDER BY r."createdAt", r."id"
          ),
          cc."createdAt"
        ))) / 86400.0 AS days
        FROM "Redemption" r
        JOIN "CustomerCard" cc ON cc."id" = r."customerCardId"
        WHERE cc."cardId" IN (${Prisma.join(cardIds)})
      ) s
    `),
  ]);

  // "I dag" og "seneste 7 dage" udledes af de KØBENHAVNS-korrekte dags-buckets,
  // saa noegletal og graf altid er enige (ingen UTC/CET-forskydning ved midnat).
  const perDay = buildPerDay(recentStamps.map((s) => s.createdAt));
  const stampsToday = perDay[perDay.length - 1]?.count ?? 0;
  const stampsWeek = perDay.slice(-7).reduce((sum, d) => sum + d.count, 0);

  const newPerDay = buildPerDay(recentCustomerCards.map((c) => c.createdAt));
  const newCustomers7 = newPerDay.slice(-7).reduce((sum, d) => sum + d.count, 0);

  const methodCount = new Map(
    methodGroups.map((g) => [g.method, g._count._all]),
  );
  const byMethod = {
    kiosk: methodCount.get("KIOSK_QR") ?? 0,
    staff: methodCount.get("STAFF_SCAN") ?? 0,
    manual: methodCount.get("MANUAL") ?? 0,
  };

  const revisitRate = atLeast1 ? atLeast2 / atLeast1 : 0;
  // Andel af kunder der har fyldt mindst eet kort (distinkt, saa den aldrig
  // overstiger 100 %).
  const completionRate = totalCustomers ? distinctRedeemers / totalCustomers : 0;

  const avgVal = avgRows[0]?.avg_days;
  const avgDaysToFull =
    avgVal == null ? null : Math.round(Math.max(0, avgVal) * 10) / 10;

  return {
    totalCustomers,
    activeCustomers,
    newCustomers30,
    newCustomers7,
    stampsToday,
    stampsWeek,
    stampsTotal,
    redemptionsTotal,
    redemptions30,
    revisitRate,
    completionRate,
    avgDaysToFull,
    byMethod,
    perDay,
    newPerDay,
  };
}

function buildPerDay(dates: Date[]): BusinessStats["perDay"] {
  // Bucket OG etiket i dansk tidszone, saa stempler ved midnat lander paa
  // den rigtige dag (ikke UTC-dagen).
  const keyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
  });
  const labelFmt = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    day: "numeric",
    month: "short",
  });
  const wdFmt = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "short",
  });
  const buckets = new Map<string, number>();
  const days: BusinessStats["perDay"] = [];
  // Anker ved kl. 12 UTC og skridt hele doegn: saa lander 24-timers-skridtet
  // aldrig taet paa midnat i dansk tid, og ingen dag tabes/dubleres ved
  // sommertidsskift (hvor et raat 24-timers-skridt kan ramme samme dato to gange).
  const noon = new Date();
  noon.setUTCHours(12, 0, 0, 0);
  for (let i = 13; i >= 0; i--) {
    const d = new Date(noon.getTime() - i * 86_400_000);
    const key = keyFmt.format(d);
    buckets.set(key, 0);
    days.push({
      date: key,
      label: labelFmt.format(d),
      weekday: wdFmt.format(d).replace(".", ""),
      count: 0,
    });
  }
  for (const dt of dates) {
    const key = keyFmt.format(dt);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({ ...d, count: buckets.get(d.date) ?? 0 }));
}

export type WeeklyStats = {
  stampsWeek: number;
  stampsDelta: number; // stempler denne uge minus ugen før
  newCustomers: number;
  redemptions: number;
  churn: number; // kunder der er ved at glide fra dig
};

/** Tal til den ugentlige statistik-mail. Rullende 7-dages vinduer. */
export async function getWeeklyStats(businessId: string): Promise<WeeklyStats> {
  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);
  if (cardIds.length === 0) {
    return { stampsWeek: 0, stampsDelta: 0, newCustomers: 0, redemptions: 0, churn: 0 };
  }

  const rel = { customerCard: { cardId: { in: cardIds } } };
  const d7 = daysAgo(7);
  const d14 = daysAgo(14);
  const d21 = daysAgo(21);
  const d60 = daysAgo(60);

  const [stampsWeek, stampsPrevWeek, newCustomers, redemptions, churn] =
    await Promise.all([
      prisma.stamp.count({ where: { ...rel, createdAt: { gte: d7 } } }),
      prisma.stamp.count({ where: { ...rel, createdAt: { gte: d14, lt: d7 } } }),
      prisma.customerCard.count({
        where: { cardId: { in: cardIds }, createdAt: { gte: d7 } },
      }),
      prisma.redemption.count({ where: { ...rel, createdAt: { gte: d7 } } }),
      // "Ved at glide fra dig": var engagerede, men ikke set i 21-60 dage.
      prisma.customerCard.count({
        where: {
          cardId: { in: cardIds },
          lastStampAt: { gte: d60, lt: d21 },
          OR: [{ completedCount: { gte: 1 } }, { stamps: { gte: 2 } }],
        },
      }),
    ]);

  return {
    stampsWeek,
    stampsDelta: stampsWeek - stampsPrevWeek,
    newCustomers,
    redemptions,
    churn,
  };
}

export async function getRecentActivity(businessId: string, take = 12) {
  return prisma.auditLog.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    take,
  });
}
