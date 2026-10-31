import "server-only";
import type { ReferralStatus, RewardType } from "@prisma/client";
import { prisma } from "./prisma";
import { isReferralStale, monthStartCopenhagen } from "./referral";
import { classifyDeskQuery } from "./referral-query";
import { rewardPhrase } from "./referral-text";

// Henvisninger ved kassen og i dashboardet (fase 3). Kun laesning her; alle
// overgange gaar gennem lib/referral (tilstandsmaskinen). Alt er scopet paa
// butikken, og kortene findes via CustomerCard.businessId, som henvisnings-
// modulet altid saetter (stempelkunder uden henvisning har hverken navn,
// mobil eller kode, saa de rammes ikke af en soegning).

type Db = typeof prisma;

export type DeskHit = {
  id: string;
  name: string | null;
  /** E-mail fra tilmeldingen (nye kunder); aeldre kort har kun mobil. */
  email: string | null;
  phone: string | null;
  code: string | null;
};

/** Soeg paa navn, e-mail, mobil eller kode. Max 8 hits, nyeste foerst. */
export async function searchDeskCustomers(
  businessId: string,
  query: string,
  db: Db = prisma,
): Promise<DeskHit[]> {
  const q = classifyDeskQuery(query);
  if (!q) return [];
  const hits = await searchBy(businessId, q, db);
  // Et navn kan ligne en kode ("Anne-Ka"): finder koden intet, soeg paa navn.
  if (hits.length === 0 && q.kind === "code") {
    return searchBy(businessId, { kind: "name", value: query.trim().replace(/\s+/g, " ") }, db);
  }
  return hits;
}

async function searchBy(
  businessId: string,
  q: NonNullable<ReturnType<typeof classifyDeskQuery>>,
  db: Db,
): Promise<DeskHit[]> {
  const where =
    q.kind === "code"
      ? { referralCode: q.value }
      : q.kind === "phone"
        ? { phone: { contains: q.value } }
        : {
            // Fri tekst rammer baade navn og e-mail ("sara" og "sara@mail.dk").
            OR: [
              { name: { contains: q.value, mode: "insensitive" as const } },
              { contactEmail: { contains: q.value.toLowerCase() } },
            ],
          };
  const rows = await db.customerCard.findMany({
    where: { businessId, ...where },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, name: true, contactEmail: true, phone: true, referralCode: true },
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.contactEmail,
    phone: r.phone,
    code: r.referralCode,
  }));
}

export type DeskCustomer = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  code: string | null;
  /** Kunden er henvist, og henvisningen venter paa foerste besoeg. */
  openReferral: {
    id: string;
    referrerName: string | null;
    referrerCode: string | null;
    createdAt: string;
    stale: boolean;
    /** Vennens rabat ved foerste besoeg, fx "100 kr." (null uden regel). */
    friendReward: string | null;
  } | null;
  /** Kan kobles til en henviser ved disken (har ingen henviser endnu). */
  canLink: boolean;
  rewards: { id: string; type: RewardType; value: string; expiresAt: string }[];
  referralsDone: number;
};

/** Kundens resultatkort ved kassen. Find via kort-id (soegning) eller serial (scan). */
export async function getDeskCustomer(
  businessId: string,
  by: { cardId: string } | { serial: string },
  now: Date = new Date(),
  db: Db = prisma,
): Promise<DeskCustomer | null> {
  const cc = await db.customerCard.findUnique({
    where: "cardId" in by ? { id: by.cardId } : { serial: by.serial },
    select: {
      id: true,
      name: true,
      contactEmail: true,
      phone: true,
      referralCode: true,
      referredByCardId: true,
      card: { select: { businessId: true } },
      referralReceived: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          referrerCard: { select: { name: true, referralCode: true } },
        },
      },
      rewards: {
        where: { status: "AVAILABLE", expiresAt: { gt: now } },
        orderBy: { createdAt: "asc" },
        select: { id: true, type: true, value: true, expiresAt: true },
      },
    },
  });
  // Butikken afgoeres af kortets skabelon (ogsaa for stempelkunder uden businessId).
  if (!cc || cc.card.businessId !== businessId) return null;

  const rule = await db.referralRule.findUnique({
    where: { businessId },
    select: { rewardExpiryDays: true, newCustomerRewardType: true, newCustomerRewardValue: true },
  });
  const received = cc.referralReceived;
  const referralsDone = await db.referral.count({
    where: { referrerCardId: cc.id, status: "REWARDED" },
  });

  return {
    id: cc.id,
    name: cc.name,
    email: cc.contactEmail,
    phone: cc.phone,
    code: cc.referralCode,
    openReferral:
      received && received.status === "CREATED"
        ? {
            id: received.id,
            referrerName: received.referrerCard?.name ?? null,
            referrerCode: received.referrerCard?.referralCode ?? null,
            createdAt: received.createdAt.toISOString(),
            stale: rule ? isReferralStale(received.createdAt, rule.rewardExpiryDays, now) : false,
            friendReward: rule ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : null,
          }
        : null,
    canLink: cc.referredByCardId === null && received === null,
    rewards: cc.rewards.map((r) => ({ ...r, expiresAt: r.expiresAt.toISOString() })),
    referralsDone,
  };
}

// ── Dashboard-fanen ──────────────────────────────────────────────────

export type ReferralRow = {
  id: string;
  status: ReferralStatus;
  createdAt: string;
  referrer: { id: string; name: string | null; code: string | null };
  referred: { id: string; name: string | null };
  /** Beloenninger fra denne henvisning, der kan indloeses nu. */
  openRewards: { id: string; cardId: string; type: RewardType; value: string }[];
};

export async function getReferralOverview(
  businessId: string,
  now: Date = new Date(),
  db: Db = prisma,
) {
  const monthStart = monthStartCopenhagen(now);
  const [open, doneThisMonth, pending, recent, top] = await Promise.all([
    db.referral.count({ where: { businessId, status: "CREATED" } }),
    db.referral.count({
      where: { businessId, status: "REWARDED", rewardedAt: { gte: monthStart } },
    }),
    db.reward.findMany({
      where: { businessId, status: "AVAILABLE", expiresAt: { gt: now } },
      select: { type: true, value: true },
    }),
    db.referral.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        status: true,
        createdAt: true,
        referrerCard: { select: { id: true, name: true, referralCode: true } },
        referredCard: { select: { id: true, name: true } },
        rewards: {
          where: { status: "AVAILABLE", expiresAt: { gt: now } },
          select: { id: true, cardId: true, type: true, value: true },
        },
      },
    }),
    db.referral.groupBy({
      by: ["referrerCardId"],
      where: { businessId, status: "REWARDED" },
      _count: { referrerCardId: true },
      orderBy: { _count: { referrerCardId: "desc" } },
      take: 10,
    }),
  ]);

  const topCards = await db.customerCard.findMany({
    where: { id: { in: top.flatMap((t) => (t.referrerCardId ? [t.referrerCardId] : [])) } },
    select: { id: true, name: true, referralCode: true },
  });
  const byId = new Map(topCards.map((c) => [c.id, c]));

  return {
    open,
    doneThisMonth,
    pendingRewards: pending.length,
    // Forpligtelsen i kroner (kun beloeb; stempler/service taelles i antal).
    pendingAmountKr: pending
      .filter((r) => r.type === "AMOUNT")
      .reduce((sum, r) => sum + (Number.parseInt(r.value, 10) || 0), 0),
    recent: recent.map(
      (r): ReferralRow => ({
        id: r.id,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        referrer: referrerOf(r.referrerCard),
        referred: { id: r.referredCard.id, name: r.referredCard.name },
        openRewards: r.rewards,
      }),
    ),
    topAmbassadors: top.flatMap((t) =>
      t.referrerCardId
        ? [
            {
              id: t.referrerCardId,
              name: byId.get(t.referrerCardId)?.name ?? null,
              code: byId.get(t.referrerCardId)?.referralCode ?? null,
              referrals: t._count.referrerCardId,
            },
          ]
        : [],
    ),
  };
}

/** Raekker til CSV-eksporten: alle med en henvisningskode. */
export async function referralExportRows(businessId: string, db: Db = prisma) {
  const now = new Date();
  const cards = await db.customerCard.findMany({
    where: { businessId, referralCode: { not: null } },
    orderBy: { createdAt: "asc" },
    select: {
      name: true,
      contactEmail: true,
      marketingConsentAt: true,
      phone: true,
      referralCode: true,
      createdAt: true,
      referredBy: { select: { name: true, referralCode: true } },
      _count: { select: { referralsMade: { where: { status: "REWARDED" } } } },
      rewards: {
        where: { status: "AVAILABLE", expiresAt: { gt: now } },
        select: { id: true },
      },
    },
  });
  return cards.map((c) => ({
    name: c.name,
    email: c.contactEmail,
    consentAt: c.marketingConsentAt,
    phone: c.phone,
    code: c.referralCode,
    referredBy: c.referredBy?.referralCode ?? null,
    referralsDone: c._count.referralsMade,
    rewardsAvailable: c.rewards.length,
    createdAt: c.createdAt,
  }));
}

// ── Arbejdslisten (Overblik) ─────────────────────────────────────────

export type WaitingRow = {
  referralId: string;
  createdAt: string;
  stale: boolean;
  referred: { id: string; name: string | null; email: string | null; phone: string | null; code: string | null };
  referrer: { id: string; name: string | null; code: string | null };
};

export type OwedRow = {
  rewardId: string;
  createdAt: string;
  expiresAt: string;
  type: RewardType;
  value: string;
  card: { id: string; name: string | null; email: string | null; phone: string | null; code: string | null };
  /** Den ven, belønningen kom fra (ambassadør), eller null for den nye kundes egen. */
  forReferring: string | null;
};

/**
 * Det, personalet skal krydse af: nye kunder der venter paa deres foerste besoeg
 * ("Rabat givet") og beloenninger der venter paa at blive indloest. Soegningen
 * rammer BEGGE parters navn, e-mail, mobil og kode, saa "jeg er blevet henvist af Sara"
 * og "jeg hedder Mikkel" begge finder raekken.
 */
export async function getReferralWorklist(
  businessId: string,
  query: string,
  now: Date = new Date(),
  db: Db = prisma,
): Promise<{ waiting: WaitingRow[]; owed: OwedRow[] }> {
  const q = query.trim().replace(/\s+/g, " ").slice(0, 60);
  const digits = q.replace(/\D/g, "");
  const code = q.toUpperCase().replace(/\s+/g, "");
  const cardMatch = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { referralCode: { contains: code } },
          { contactEmail: { contains: q.toLowerCase() } },
          ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
        ],
      }
    : undefined;

  const [rule, waiting, owed] = await Promise.all([
    db.referralRule.findUnique({ where: { businessId }, select: { rewardExpiryDays: true } }),
    db.referral.findMany({
      where: {
        businessId,
        status: "CREATED",
        ...(cardMatch ? { OR: [{ referredCard: cardMatch }, { referrerCard: cardMatch }] } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        referredCard: {
          select: { id: true, name: true, contactEmail: true, phone: true, referralCode: true },
        },
        referrerCard: { select: { id: true, name: true, referralCode: true } },
      },
    }),
    db.reward.findMany({
      where: {
        businessId,
        status: "AVAILABLE",
        expiresAt: { gt: now },
        ...(cardMatch ? { card: cardMatch } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        type: true,
        value: true,
        card: { select: { id: true, name: true, contactEmail: true, phone: true, referralCode: true } },
        referral: { select: { referrerCardId: true, referredCard: { select: { name: true } } } },
      },
    }),
  ]);

  return {
    waiting: waiting.map((r) => ({
      referralId: r.id,
      createdAt: r.createdAt.toISOString(),
      stale: rule ? isReferralStale(r.createdAt, rule.rewardExpiryDays, now) : false,
      referred: {
        id: r.referredCard.id,
        name: r.referredCard.name,
        email: r.referredCard.contactEmail,
        phone: r.referredCard.phone,
        code: r.referredCard.referralCode,
      },
      referrer: referrerOf(r.referrerCard),
    })),
    owed: owed.map((w) => ({
      rewardId: w.id,
      createdAt: w.createdAt.toISOString(),
      expiresAt: w.expiresAt.toISOString(),
      type: w.type,
      value: w.value,
      card: {
        id: w.card.id,
        name: w.card.name,
        email: w.card.contactEmail,
        phone: w.card.phone,
        code: w.card.referralCode,
      },
      forReferring:
        w.referral && w.referral.referrerCardId === w.card.id
          ? (w.referral.referredCard.name ?? "en ven")
          : null,
    })),
  };
}

/** Henviseren i en raekke. Er kortet slettet, staar henvisningen uden henviser. */
function referrerOf(
  card: { id: string; name: string | null; referralCode: string | null } | null,
): { id: string; name: string | null; code: string | null } {
  return card
    ? { id: card.id, name: card.name, code: card.referralCode }
    : { id: "", name: "Slettet kunde", code: null };
}
