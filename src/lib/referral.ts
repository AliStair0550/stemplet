import "server-only";
import type {
  Prisma,
  ReferralSource,
  ReferralStatus,
  RewardType,
} from "@prisma/client";
import { prisma } from "./prisma";
import { runOnce } from "./idempotency";
import { generateReferralCode } from "./referral-code";
import { normalizePhone } from "./phone";
import { normalizeEmail } from "./contact";

// Henvisninger: tilstandsmaskinen og reglerne (docs/henvisninger.md, Datamodel).
// Al henvisningslogik bor her, saa kassepanel, kundeside og cron kalder de samme
// funktioner. Ren beslutningslogik (canTransition, planRewards, ...) er adskilt
// fra I/O, saa reglerne kan enhedstestes uden database.
//
//   created ──(kassen: foerste besoeg)──> visited ──(samme transaktion)──> rewarded
//      │                                    │
//      ├──(cron: for gammel)──> expired     └──(butikken)──> voided
//      └──(butikken)──> voided
//
// visited er en mellemtilstand: recordFirstVisit gaar created -> visited ->
// rewarded i EEN transaktion, saa visited aldrig ses af andre. Den findes som
// tilstand, saa overgangen er eksplicit og visitedAt/staff logges for sig.

// Advisory-laas-navnerum for henviserens maanedsloft (stamp.ts bruger 4271).
const REFERRAL_CAP_LOCK = 4272;

const TIME_ZONE = "Europe/Copenhagen";
const DAY_MS = 86_400_000;

type Db = typeof prisma;

export const REFERRAL_TRANSITIONS: Record<ReferralStatus, readonly ReferralStatus[]> = {
  CREATED: ["VISITED", "EXPIRED", "VOIDED"],
  VISITED: ["REWARDED", "VOIDED"],
  REWARDED: [],
  EXPIRED: [],
  VOIDED: [],
};

export function canTransition(from: ReferralStatus, to: ReferralStatus): boolean {
  return REFERRAL_TRANSITIONS[from].includes(to);
}

export class ReferralError extends Error {
  code:
    | "NOT_FOUND"
    | "DISABLED"
    | "SELF_REFERRAL"
    | "ALREADY_REFERRED"
    | "INVALID_TRANSITION"
    | "EXPIRED"
    | "NO_RULE"
    | "INVALID_RULE"
    | "NO_STAFF"
    | "CODE_EXHAUSTED";
  constructor(code: ReferralError["code"], message: string) {
    super(message);
    this.name = "ReferralError";
    this.code = code;
  }
}

// ── Ren beslutningslogik ─────────────────────────────────────────────

type CardIdentity = { id: string; phone: string | null; contactEmail?: string | null };

/**
 * Selvhenvisning: samme kort, samme (normaliserede) e-mail eller samme mobil-
 * nummer. Tilmeldingen bruger e-mail; aeldre kort kan stadig have et mobilnummer,
 * saa det sammenlignes ogsaa, naar begge kort har et.
 */
export function isSelfReferral(referrer: CardIdentity, referred: CardIdentity): boolean {
  if (referrer.id === referred.id) return true;
  const ea = normalizeEmail(referrer.contactEmail);
  const eb = normalizeEmail(referred.contactEmail);
  if (ea !== null && ea === eb) return true;
  const a = normalizePhone(referrer.phone);
  const b = normalizePhone(referred.phone);
  return a !== null && a === b;
}

/** En aaben henvisning er for gammel, naar den er aeldre end reward_expiry_days. */
export function isReferralStale(createdAt: Date, expiryDays: number, now: Date): boolean {
  return now.getTime() - createdAt.getTime() > expiryDays * DAY_MS;
}

export function rewardExpiresAt(now: Date, expiryDays: number): Date {
  return new Date(now.getTime() + expiryDays * DAY_MS);
}

// Forskel mellem dansk lokaltid og UTC paa et givet tidspunkt.
function tzOffsetMs(at: Date): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((x) => [x.type, x.value]),
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Den 1. i indevaerende maaned kl. 00:00 dansk tid, som et UTC-tidspunkt. */
export function monthStartCopenhagen(now: Date): Date {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  const guess = Date.UTC(+p.year, +p.month - 1, 1);
  return new Date(guess - tzOffsetMs(new Date(guess)));
}

/** amount/stamps skal vaere et positivt heltal, procent 1-100; service en ikke-tom tekst. */
export function isValidRewardValue(type: RewardType, value: string): boolean {
  const v = value.trim();
  if (type === "SERVICE") return v.length > 0 && v.length <= 80;
  if (type === "PERCENT") return /^[1-9]\d?$|^100$/.test(v);
  return /^[1-9]\d{0,5}$/.test(v);
}

export type RewardPlan = { type: RewardType; value: string };

/**
 * Hvilke beloenninger en gennemfoert henvisning giver. Den nye kunde beloennes
 * altid. Henviseren beloennes kun under sit maanedsloft (talt paa rewarded i
 * indevaerende kalendermaaned, foer denne henvisning).
 */
export function planRewards(
  rule: {
    newCustomerRewardType: RewardType;
    newCustomerRewardValue: string;
    referrerRewardType: RewardType;
    referrerRewardValue: string;
    maxReferralsPerMonth: number | null;
  },
  referrerRewardedThisMonth: number,
): { newCustomer: RewardPlan; referrer: RewardPlan | null } {
  const underCap =
    rule.maxReferralsPerMonth === null ||
    referrerRewardedThisMonth < rule.maxReferralsPerMonth;
  return {
    newCustomer: { type: rule.newCustomerRewardType, value: rule.newCustomerRewardValue },
    referrer: underCap
      ? { type: rule.referrerRewardType, value: rule.referrerRewardValue }
      : null,
  };
}

// ── Regler (butikkens opsaetning) ────────────────────────────────────

export type ReferralRuleInput = {
  newCustomerRewardType: RewardType;
  newCustomerRewardValue: string;
  referrerRewardType: RewardType;
  referrerRewardValue: string;
  minPurchaseKr?: number | null;
  maxReferralsPerMonth?: number | null;
  rewardExpiryDays?: number;
  termsLine?: string | null;
};

/** Opret/opdatér butikkens regel. Validerer, saa en ugyldig regel aldrig gemmes. */
export async function saveReferralRule(
  businessId: string,
  input: ReferralRuleInput,
  db: Db = prisma,
) {
  const ok =
    isValidRewardValue(input.newCustomerRewardType, input.newCustomerRewardValue) &&
    isValidRewardValue(input.referrerRewardType, input.referrerRewardValue) &&
    (input.rewardExpiryDays ?? 180) > 0 &&
    (input.maxReferralsPerMonth ?? 0) >= 0 &&
    (input.minPurchaseKr ?? 0) >= 0;
  if (!ok) throw new ReferralError("INVALID_RULE", "Henvisningsreglen er ugyldig.");
  const data = {
    newCustomerRewardType: input.newCustomerRewardType,
    newCustomerRewardValue: input.newCustomerRewardValue.trim(),
    referrerRewardType: input.referrerRewardType,
    referrerRewardValue: input.referrerRewardValue.trim(),
    minPurchaseKr: input.minPurchaseKr ?? null,
    maxReferralsPerMonth: input.maxReferralsPerMonth ?? null,
    rewardExpiryDays: input.rewardExpiryDays ?? 180,
    termsLine: input.termsLine?.trim() || null,
  };
  return db.referralRule.upsert({
    where: { businessId },
    create: { businessId, ...data },
    update: data,
  });
}

// ── Henvisningskode ──────────────────────────────────────────────────

const CODE_TRIES = 12;

/**
 * Giv kortet en henvisningskode (NAVN-XX), unik pr. butik. Har kortet allerede
 * en kode, returneres den. Kollision (P2002 paa unik-indekset) -> nyt forsoeg.
 * Er alle forsoeg med to tegn optaget (meget almindeligt navn i en stor butik),
 * proeves med tre tegn, saa oprettelsen aldrig gaar i staa.
 */
export async function assignReferralCode(
  opts: { customerCardId: string; name?: string | null },
  db: Db = prisma,
  rand?: (max: number) => number,
): Promise<string> {
  const cc = await db.customerCard.findUnique({
    where: { id: opts.customerCardId },
    select: { referralCode: true, name: true, card: { select: { businessId: true } } },
  });
  if (!cc) throw new ReferralError("NOT_FOUND", "Kortet blev ikke fundet.");
  if (cc.referralCode) return cc.referralCode;
  const name = opts.name?.trim() || cc.name;

  for (let i = 0; i < CODE_TRIES * 2; i++) {
    const code = generateReferralCode(name, i < CODE_TRIES ? 2 : 3, rand);
    try {
      // Guardet: kun hvis kortet stadig mangler en kode (samtidig tildeling).
      const res = await db.customerCard.updateMany({
        where: { id: opts.customerCardId, referralCode: null },
        data: {
          referralCode: code,
          businessId: cc.card.businessId,
          ...(name && !cc.name ? { name } : {}),
        },
      });
      if (res.count === 1) return code;
      const now = await db.customerCard.findUnique({
        where: { id: opts.customerCardId },
        select: { referralCode: true },
      });
      if (now?.referralCode) return now.referralCode;
    } catch (e) {
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  throw new ReferralError("CODE_EXHAUSTED", "Kunne ikke finde en ledig kode.");
}

// ── created: ny henvisning ───────────────────────────────────────────

/**
 * Opret en aaben henvisning (created). Skaber ingen vaerdi: beloenninger opstaar
 * foerst i recordFirstVisit fra kassen. Et kort kan kun henvises een gang: det
 * foerste vinder (guardet update paa referredByCardId + unik referredCardId).
 */
export async function createReferral(
  opts: {
    businessId: string;
    referrerCardId: string;
    referredCardId: string;
    source: ReferralSource;
  },
  db: Db = prisma,
) {
  return db.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: opts.businessId },
      select: { referralsEnabled: true, stopped: true },
    });
    if (!business) throw new ReferralError("NOT_FOUND", "Butikken blev ikke fundet.");
    if (!business.referralsEnabled || business.stopped) {
      throw new ReferralError("DISABLED", "Henvisninger er ikke slået til.");
    }

    const select = {
      id: true,
      phone: true,
      contactEmail: true,
      card: { select: { businessId: true } },
    } as const;
    const [referrer, referred] = await Promise.all([
      tx.customerCard.findUnique({ where: { id: opts.referrerCardId }, select }),
      tx.customerCard.findUnique({ where: { id: opts.referredCardId }, select }),
    ]);
    if (
      !referrer ||
      !referred ||
      referrer.card.businessId !== opts.businessId ||
      referred.card.businessId !== opts.businessId
    ) {
      throw new ReferralError("NOT_FOUND", "Kortet hører ikke til butikken.");
    }
    if (isSelfReferral(referrer, referred)) {
      throw new ReferralError("SELF_REFERRAL", "Man kan ikke henvise sig selv.");
    }

    // Det foerste vinder: saet kun referredBy, hvis kortet ikke allerede har en.
    // Row-laasen fra updaten serialiserer to samtidige links til samme kort, saa
    // den anden ser den committede vaerdi og faar count 0.
    const claimed = await tx.customerCard.updateMany({
      where: { id: referred.id, referredByCardId: null },
      data: { referredByCardId: referrer.id, businessId: opts.businessId },
    });
    if (claimed.count === 0) {
      // Samme kobling igen (dobbelttryk eller genforsoeg efter et tabt svar):
      // svar med den henvisning, der allerede findes, i stedet for en fejl.
      const existing = await tx.referral.findUnique({ where: { referredCardId: referred.id } });
      if (existing && existing.referrerCardId === referrer.id) return existing;
      throw new ReferralError("ALREADY_REFERRED", "Kunden er allerede henvist.");
    }

    return tx.referral.create({
      data: {
        businessId: opts.businessId,
        referrerCardId: referrer.id,
        referredCardId: referred.id,
        source: opts.source,
      },
    });
  });
}

// ── created -> visited -> rewarded: foerste besoeg fra kassen ─────────

// Tidspunkter som ISO-tekst: svaret kan komme tilbage fra Redis (runOnce) som
// JSON, og skal da vaere identisk med det oprindelige svar.
export type VisitResult = {
  referralId: string;
  status: "REWARDED";
  rewardedAt: string;
  rewards: {
    id: string;
    cardId: string;
    role: "newCustomer" | "referrer";
    type: RewardType;
    value: string;
    expiresAt: string;
    /** REDEEMED for den nye kundes rabat, naar den gives ved samme besoeg. */
    status: "AVAILABLE" | "REDEEMED" | "EXPIRED";
  }[];
};

async function loadVisitResult(
  tx: Prisma.TransactionClient,
  referral: { id: string; referredCardId: string; rewardedAt: Date | null },
): Promise<VisitResult> {
  const rewards = await tx.reward.findMany({
    where: { referralId: referral.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, cardId: true, type: true, value: true, expiresAt: true, status: true },
  });
  return {
    referralId: referral.id,
    status: "REWARDED",
    rewardedAt: (referral.rewardedAt ?? new Date()).toISOString(),
    rewards: rewards.map((r) => ({
      ...r,
      expiresAt: r.expiresAt.toISOString(),
      role: r.cardId === referral.referredCardId ? "newCustomer" : "referrer",
    })),
  };
}

/**
 * "Foerste besoeg gennemfoert" fra kassen. created -> visited -> rewarded i EEN
 * transaktion, og to reward-raekker (ny kunde + henviser under loftet).
 *
 * Samme moenster som stempling:
 *  - runOnce (Redis) med butikkens idempotency key: et retry efter tabt svar faar
 *    foerste svar igen, et samtidigt identisk tryk faar IdempotencyInFlight.
 *  - Raekke-laas (FOR UPDATE) paa henvisningen: to tryk paa samme henvisning
 *    serialiseres, og kun det foerste finder status created.
 *  - Advisory-laas pr. henviser: maanedsloftet kan ikke races af to henvisninger
 *    fra samme ambassadoer paa samme tid.
 * Noeglen gemmes ogsaa paa henvisningen, saa et gentaget tryk med samme noegle
 * giver samme svar, ogsaa hvis Redis er nede (runOnce er fail-open).
 */
export async function recordFirstVisit(
  opts: {
    referralId: string;
    businessId: string;
    staffUserId?: string | null;
    staffDeviceId?: string | null;
    idempotencyKey?: string;
    now?: Date;
    /** Vennens rabat bruges ved dette besoeg: indloes den i samme transaktion
     *  ("Rabat givet" i kassen), saa der kun skal trykkes een gang. */
    redeemNewCustomerReward?: boolean;
  },
  db: Db = prisma,
): Promise<VisitResult> {
  if (!opts.staffUserId && !opts.staffDeviceId) {
    throw new ReferralError("NO_STAFF", "Første besøg skal bekræftes fra kassen.");
  }
  const key = opts.idempotencyKey?.trim() || undefined;
  return runOnce(
    key ? `${opts.businessId}:referral-visit:${key}` : undefined,
    () => db.$transaction((tx) => visitTx(tx, { ...opts, idempotencyKey: key })),
  );
}

async function visitTx(
  tx: Prisma.TransactionClient,
  opts: {
    referralId: string;
    businessId: string;
    staffUserId?: string | null;
    staffDeviceId?: string | null;
    idempotencyKey?: string;
    now?: Date;
    redeemNewCustomerReward?: boolean;
  },
): Promise<VisitResult> {
  const now = opts.now ?? new Date();

  // Laas henvisningen foerst: et dobbelttryk venter her, til det foerste har
  // committet, og ser derefter status rewarded.
  await tx.$queryRaw`SELECT id FROM "Referral" WHERE id = ${opts.referralId} FOR UPDATE`;
  const referral = await tx.referral.findUnique({ where: { id: opts.referralId } });
  if (!referral || referral.businessId !== opts.businessId) {
    throw new ReferralError("NOT_FOUND", "Henvisningen blev ikke fundet.");
  }

  // Samme tryk igen (samme noegle): returnér det oprindelige resultat.
  if (
    referral.status === "REWARDED" &&
    opts.idempotencyKey &&
    referral.visitIdempotencyKey === opts.idempotencyKey
  ) {
    return loadVisitResult(tx, referral);
  }
  if (!canTransition(referral.status, "VISITED")) {
    throw new ReferralError(
      "INVALID_TRANSITION",
      referral.status === "REWARDED"
        ? "Henvisningen er allerede gennemført."
        : "Henvisningen kan ikke gennemføres.",
    );
  }

  const business = await tx.business.findUnique({
    where: { id: opts.businessId },
    select: { referralsEnabled: true, stopped: true, referralRule: true },
  });
  if (!business?.referralsEnabled || business.stopped) {
    throw new ReferralError("DISABLED", "Henvisninger er ikke slået til.");
  }
  const rule = business.referralRule;
  if (!rule) throw new ReferralError("NO_RULE", "Butikken har ingen henvisningsregel.");
  if (
    !isValidRewardValue(rule.newCustomerRewardType, rule.newCustomerRewardValue) ||
    !isValidRewardValue(rule.referrerRewardType, rule.referrerRewardValue)
  ) {
    throw new ReferralError("INVALID_RULE", "Henvisningsreglen er ugyldig.");
  }
  // For gammel: cron'en markerer den expired; her afvises den bare.
  if (isReferralStale(referral.createdAt, rule.rewardExpiryDays, now)) {
    throw new ReferralError("EXPIRED", "Henvisningen er udløbet.");
  }

  // created -> visited (guardet, selv om raekken er laast).
  const visited = await tx.referral.updateMany({
    where: { id: referral.id, status: "CREATED" },
    data: {
      status: "VISITED",
      visitedAt: now,
      visitedByStaffUserId: opts.staffUserId ?? null,
      visitedByStaffDeviceId: opts.staffDeviceId ?? null,
      visitIdempotencyKey: opts.idempotencyKey ?? null,
    },
  });
  if (visited.count !== 1) {
    throw new ReferralError("INVALID_TRANSITION", "Henvisningen kan ikke gennemføres.");
  }

  // Loftet tælles pr. henviser paa rewarded i kalendermaaneden. Serialisér pr.
  // henviser, saa to samtidige henvisninger ikke begge ser "under loftet".
  // Er henviserens kort slettet, faar vennen stadig sin rabat, men der er ingen
  // henviser at belønne.
  const referrerCardId = referral.referrerCardId;
  let rewardedThisMonth = 0;
  if (referrerCardId) {
    await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(${REFERRAL_CAP_LOCK}::int, hashtext(${referrerCardId}))) _lock`;
    rewardedThisMonth = await tx.referral.count({
      where: {
        referrerCardId,
        status: "REWARDED",
        rewardedAt: { gte: monthStartCopenhagen(now) },
      },
    });
  }
  const plan = planRewards(rule, rewardedThisMonth);
  const expiresAt = rewardExpiresAt(now, rule.rewardExpiryDays);

  await tx.reward.create({
    data: {
      businessId: referral.businessId,
      cardId: referral.referredCardId,
      referralId: referral.id,
      type: plan.newCustomer.type,
      value: plan.newCustomer.value,
      expiresAt,
      createdAt: now,
      // Rabat givet ved besoeget: indloest med det samme af samme medarbejder.
      ...(opts.redeemNewCustomerReward
        ? {
            status: "REDEEMED" as const,
            redeemedAt: now,
            redeemedByStaffUserId: opts.staffUserId ?? null,
            redeemedByStaffDeviceId: opts.staffDeviceId ?? null,
          }
        : {}),
    },
  });
  if (plan.referrer && referrerCardId) {
    await tx.reward.create({
      data: {
        businessId: referral.businessId,
        cardId: referrerCardId,
        referralId: referral.id,
        type: plan.referrer.type,
        value: plan.referrer.value,
        expiresAt,
        createdAt: now,
      },
    });
  }

  // visited -> rewarded i samme transaktion.
  await tx.referral.updateMany({
    where: { id: referral.id, status: "VISITED" },
    data: { status: "REWARDED", rewardedAt: now },
  });

  return loadVisitResult(tx, { ...referral, rewardedAt: now });
}

// ── voided ───────────────────────────────────────────────────────────

/** Butikken annullerer en aaben henvisning. En gennemfoert kan ikke annulleres. */
export async function voidReferral(
  opts: { referralId: string; businessId: string },
  db: Db = prisma,
): Promise<void> {
  const from = (Object.keys(REFERRAL_TRANSITIONS) as ReferralStatus[]).filter((s) =>
    canTransition(s, "VOIDED"),
  );
  const res = await db.referral.updateMany({
    where: { id: opts.referralId, businessId: opts.businessId, status: { in: from } },
    data: { status: "VOIDED" },
  });
  if (res.count === 0) {
    throw new ReferralError("INVALID_TRANSITION", "Henvisningen kan ikke annulleres.");
  }
}

// ── Beloenning indloest (kassen) ─────────────────────────────────────

export type RedeemResult = {
  rewardId: string;
  cardId: string;
  type: RewardType;
  value: string;
  redeemedAt: string;
};

/**
 * "Beloenning indloest" fra kassen: available -> redeemed. Samme moenster som
 * recordFirstVisit: runOnce (Redis) + raekke-laas + noeglen gemt paa raekken, saa
 * et dobbelttryk aldrig indloeser to gange, og et gentaget tryk med samme noegle
 * faar samme svar. En udloebet beloenning kan ikke indloeses (cron'en markerer den).
 * PIN tjekkes af kalderen (ruten), som i Stemplet.
 */
export async function redeemReward(
  opts: {
    rewardId: string;
    businessId: string;
    staffUserId?: string | null;
    staffDeviceId?: string | null;
    idempotencyKey?: string;
    now?: Date;
  },
  db: Db = prisma,
): Promise<RedeemResult> {
  if (!opts.staffUserId && !opts.staffDeviceId) {
    throw new ReferralError("NO_STAFF", "Indløsning skal ske fra kassen.");
  }
  const key = opts.idempotencyKey?.trim() || undefined;
  return runOnce(key ? `${opts.businessId}:reward-redeem:${key}` : undefined, () =>
    db.$transaction(async (tx) => {
      const now = opts.now ?? new Date();
      await tx.$queryRaw`SELECT id FROM "Reward" WHERE id = ${opts.rewardId} FOR UPDATE`;
      const reward = await tx.reward.findUnique({ where: { id: opts.rewardId } });
      if (!reward || reward.businessId !== opts.businessId) {
        throw new ReferralError("NOT_FOUND", "Belønningen blev ikke fundet.");
      }
      const result = (r: typeof reward): RedeemResult => ({
        rewardId: r.id,
        cardId: r.cardId,
        type: r.type,
        value: r.value,
        redeemedAt: (r.redeemedAt ?? now).toISOString(),
      });
      if (reward.status === "REDEEMED" && key && reward.redeemIdempotencyKey === key) {
        return result(reward);
      }
      if (reward.status === "REDEEMED") {
        throw new ReferralError("INVALID_TRANSITION", "Belønningen er allerede indløst.");
      }
      if (reward.status === "EXPIRED" || reward.expiresAt < now) {
        throw new ReferralError("EXPIRED", "Belønningen er udløbet.");
      }
      const updated = await tx.reward.updateMany({
        where: { id: reward.id, status: "AVAILABLE" },
        data: {
          status: "REDEEMED",
          redeemedAt: now,
          redeemedByStaffUserId: opts.staffUserId ?? null,
          redeemedByStaffDeviceId: opts.staffDeviceId ?? null,
          redeemIdempotencyKey: key ?? null,
        },
      });
      if (updated.count !== 1) {
        throw new ReferralError("INVALID_TRANSITION", "Belønningen er allerede indløst.");
      }
      return result({ ...reward, redeemedAt: now });
    }),
  );
}

// ── expired: daglig cron ─────────────────────────────────────────────

/**
 * Udloeb, koert af det daglige cron-job:
 *  - aabne henvisninger (created) aeldre end butikkens reward_expiry_days
 *  - tilgaengelige beloenninger hvis expires_at er passeret
 * Idempotent: et nyt koersel rammer kun det, der stadig er aabent. En henvisning,
 * som kassen er ved at gennemfoere, er raekke-laast; Postgres re-evaluerer
 * status efter laasen, saa den springes over i stedet for at blive expired.
 */
export async function expireReferralsAndRewards(
  now: Date = new Date(),
  db: Db = prisma,
): Promise<{ referralsExpired: number; rewardsExpired: number; cardIds: string[] }> {
  const referralsExpired = await db.$executeRaw`
    UPDATE "Referral" r
    SET "status" = 'EXPIRED'
    FROM "ReferralRule" rr
    WHERE rr."businessId" = r."businessId"
      AND r."status" = 'CREATED'
      AND r."createdAt" < (${now}::timestamptz AT TIME ZONE 'UTC') - make_interval(days => rr."rewardExpiryDays")
  `;
  // (Prisma gemmer DateTime som timestamp uden zone i UTC; AT TIME ZONE 'UTC'
  // goer sammenligningen uafhaengig af forbindelsens tidszone.)
  // Kortene med en udloebet beloenning skal opdateres i Wallet (ellers viser de
  // stadig "til gode"), saa vi noterer dem, foer de markeres.
  const where = { status: "AVAILABLE" as const, expiresAt: { lt: now } };
  const affected = await db.reward.findMany({ where, select: { cardId: true }, distinct: ["cardId"] });
  const rewards = await db.reward.updateMany({ where, data: { status: "EXPIRED" } });
  return { referralsExpired, rewardsExpired: rewards.count, cardIds: affected.map((r) => r.cardId) };
}
