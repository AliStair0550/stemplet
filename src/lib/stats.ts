import "server-only";
import { prisma } from "./prisma";

export type BusinessStats = {
  totalCustomers: number;
  activeCustomers: number;
  newCustomers30: number;
  stampsToday: number;
  stampsWeek: number;
  stampsTotal: number;
  redemptionsTotal: number;
  redemptions30: number;
  revisitRate: number;
  completionRate: number;
  avgDaysToFull: number | null;
  byMethod: { kiosk: number; staff: number; manual: number };
  perDay: { date: string; label: string; weekday: string; count: number }[];
};

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
export async function getBusinessStats(businessId: string): Promise<BusinessStats> {
  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true, stampsRequired: true },
  });
  const cardIds = cards.map((c) => c.id);
  const reqByCard = new Map(cards.map((c) => [c.id, c.stampsRequired]));

  if (cardIds.length === 0) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      newCustomers30: 0,
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
    };
  }

  const d30 = daysAgo(30);
  const d60 = daysAgo(60);
  const rel = { customerCard: { cardId: { in: cardIds } } };

  const [
    ccs,
    stampsTotal,
    redemptionsTotal,
    redemptions30,
    recentStamps,
    reds,
    methodGroups,
  ] = await Promise.all([
      prisma.customerCard.findMany({
        where: { cardId: { in: cardIds } },
        select: {
          cardId: true,
          stamps: true,
          completedCount: true,
          createdAt: true,
          lastStampAt: true,
        },
      }),
      prisma.stamp.count({ where: rel }),
      prisma.redemption.count({ where: rel }),
      prisma.redemption.count({ where: { ...rel, createdAt: { gte: d30 } } }),
      prisma.stamp.findMany({
        where: { ...rel, createdAt: { gte: daysAgo(14) } },
        select: { createdAt: true },
      }),
      prisma.redemption.findMany({
        where: rel,
        select: {
          createdAt: true,
          customerCardId: true,
          customerCard: { select: { createdAt: true } },
        },
      }),
      prisma.stamp.groupBy({
        by: ["method"],
        where: rel,
        _count: { _all: true },
      }),
    ]);

  // "I dag" og "seneste 7 dage" udledes af de KØBENHAVNS-korrekte dags-buckets,
  // saa noegletal og graf altid er enige (ingen UTC/CET-forskydning ved midnat).
  const perDay = buildPerDay(recentStamps.map((s) => s.createdAt));
  const stampsToday = perDay[perDay.length - 1]?.count ?? 0;
  const stampsWeek = perDay.slice(-7).reduce((sum, d) => sum + d.count, 0);

  const methodCount = new Map(
    methodGroups.map((g) => [g.method, g._count._all]),
  );
  const byMethod = {
    kiosk: methodCount.get("KIOSK_QR") ?? 0,
    staff: methodCount.get("STAFF_SCAN") ?? 0,
    manual: methodCount.get("MANUAL") ?? 0,
  };

  const totalCustomers = ccs.length;
  const activeCustomers = ccs.filter(
    (c) => c.lastStampAt && c.lastStampAt >= d60,
  ).length;
  const newCustomers30 = ccs.filter((c) => c.createdAt >= d30).length;

  let atLeast1 = 0;
  let atLeast2 = 0;
  for (const c of ccs) {
    const totalEver = c.stamps + c.completedCount * (reqByCard.get(c.cardId) ?? 0);
    if (totalEver >= 1) atLeast1 += 1;
    if (totalEver >= 2) atLeast2 += 1;
  }
  const revisitRate = atLeast1 ? atLeast2 / atLeast1 : 0;
  // Andel af kunder der har fyldt mindst eet kort (distinkt, saa den aldrig
  // overstiger 100 %).
  const distinctRedeemers = new Set(reds.map((r) => r.customerCardId)).size;
  const completionRate = totalCustomers ? distinctRedeemers / totalCustomers : 0;

  let avgDaysToFull: number | null = null;
  if (reds.length > 0) {
    const totalDays = reds.reduce((sum, r) => {
      const diff =
        (r.createdAt.getTime() - r.customerCard.createdAt.getTime()) /
        (1000 * 60 * 60 * 24);
      return sum + Math.max(0, diff);
    }, 0);
    avgDaysToFull = Math.round((totalDays / reds.length) * 10) / 10;
  }

  return {
    totalCustomers,
    activeCustomers,
    newCustomers30,
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
