import "server-only";
import { after } from "next/server";
import type { StampMethod, Plan } from "@prisma/client";
import { prisma } from "./prisma";
import { trackStampAnomaly } from "./security";
import { fireWebhook } from "./integrations";
import { WALLET_ENABLED } from "./env";
import { generateSerial, generateAuthToken } from "./ids";
import { canCreateCustomer, PLAN_LIMITS } from "./plans";
import { maybeFireCardholderThresholds, signupBlockReason } from "./billing";

// Advisory-laas-navnerum for kortholder-loftet (fast tal, saa det ikke kolliderer
// med andre advisory-laase).
const CARDHOLDER_CAP_LOCK = 4271;

/**
 * Opretter EET kundekort race-sikkert. Er loftet aktivt (maxCustomers != null),
 * serialiseres optaelling + oprettelse PR. BUTIK med en advisory-laas, saa to
 * samtidige tilmeldinger ved graensen ikke begge slipper forbi loftet. Er loftet
 * slaaet fra, springes optaellingen helt over (ingen spildt O(N)-count pr.
 * tilmelding). Returnerer null, hvis loftet er naaet.
 */
export async function createCardholderAtomically(
  plan: Plan,
  businessId: string,
  cardId: string,
  db: typeof prisma = prisma,
): Promise<{ id: string; serial: string; authToken: string } | null> {
  const data = {
    cardId,
    serial: generateSerial(),
    authToken: generateAuthToken(),
  };
  const select = { id: true, serial: true, authToken: true } as const;

  // Loft slaaet fra: ingen optaelling, ingen laas, bare opret.
  if (PLAN_LIMITS[plan].maxCustomers === null) {
    return db.customerCard.create({ data, select });
  }

  // Loft aktivt: serialisér count + create PR. BUTIK, saa graensen ikke kan races.
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${CARDHOLDER_CAP_LOCK}::int, hashtext(${businessId}))`;
    const total = await tx.customerCard.count({ where: { card: { businessId } } });
    if (!canCreateCustomer(plan, total)) return null;
    return tx.customerCard.create({ data, select });
  });
}

/**
 * Opretter et nyt kundekort for butikkens aktive kort. Bruges naar en ny kunde
 * scanner stempel-QR'en: kortet dannes automatisk, saa foerste stempel kan
 * gives med det samme uden en mellemskaerm. Returnerer "full", hvis butikken
 * har ramt sit gratis-loft.
 */
export async function createCustomerCard(
  businessId: string,
): Promise<
  | { ok: true; id: string; serial: string; authToken: string }
  | { ok: false; reason: "full" | "error" | "paused" }
> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      plan: true,
      stopped: true,
      newSignupsPaused: true,
      cards: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!business || business.cards.length === 0) {
    return { ok: false, reason: "error" };
  }
  // Superadmin har stoppet butikken eller sat nye kortholdere paa pause.
  if (signupBlockReason(business)) return { ok: false, reason: "paused" };

  const created = await createCardholderAtomically(
    business.plan,
    businessId,
    business.cards[0].id,
  );
  if (!created) return { ok: false, reason: "full" };
  // Fyr kortholder-taerskler (80-varsel / 100-krydsning), fire-once, efter svar.
  await maybeFireCardholderThresholds(businessId);
  return {
    ok: true,
    id: created.id,
    serial: created.serial,
    authToken: created.authToken,
  };
}

export class StampError extends Error {
  code: "COOLDOWN" | "FULL" | "INACTIVE" | "NOT_FOUND";
  constructor(code: StampError["code"], message: string) {
    super(message);
    this.name = "StampError";
    this.code = code;
  }
}

export type StampResult = {
  serial: string;
  stamps: number;
  required: number;
  rewardReady: boolean;
  justCompleted: boolean;
  increment: number;
  /** Samlet antal stempler kunden nogensinde har optjent hos butikken. */
  lifetimeStamps: number;
};

/** Live-opslag af kort via serial (webkort) med virksomhed og skabelon. */
export function loadCardBySerial(serial: string) {
  return prisma.customerCard.findUnique({
    where: { serial },
    include: { card: { include: { business: true, campaigns: true } } },
  });
}

export function loadCardByToken(authToken: string) {
  return prisma.customerCard.findUnique({
    where: { authToken },
    include: { card: { include: { business: true } } },
  });
}

/**
 * Kernen. Al stempel-logik sker på serveren, aldrig på klienten.
 * Tjekker cooldown, lægger kampagne-multiplier på, håndterer fuldt kort,
 * skriver Stamp + AuditLog og skubber Wallet-opdatering.
 */
export async function applyStamp(opts: {
  customerCardId: string;
  method: StampMethod;
  tokenJti?: string;
  ip?: string | null;
  /** Personalet staar ved disken og bestemmer selv - spring cooldown over. */
  skipCooldown?: boolean;
  /** Antal stempler paa een scanning (fx tre kaffe = tre). Standard 1. */
  count?: number;
  /** Medarbejder-attribution: sat naar kassen er ejer-login hhv. parret enhed. */
  staffUserId?: string | null;
  staffDeviceId?: string | null;
}): Promise<StampResult> {
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const cc = await tx.customerCard.findUnique({
      where: { id: opts.customerCardId },
      include: { card: { include: { business: true, campaigns: true } } },
    });
    if (!cc) throw new StampError("NOT_FOUND", "Kortet blev ikke fundet.");
    if (!cc.card.active) {
      throw new StampError("INACTIVE", "Kortet er ikke aktivt lige nu.");
    }

    const required = cc.card.stampsRequired;
    const business = cc.card.business;

    // Superadmin har stoppet butikken: ingen nye stempler (eksisterende kort kan
    // stadig ses). Kun manuel handling, ingen automatik.
    if (business.stopped) {
      throw new StampError(
        "INACTIVE",
        "Butikken tager ikke imod stempler lige nu.",
      );
    }

    // Fuldt kort: bloker flere stempler indtil belønningen er indløst.
    if (cc.stamps >= required) {
      throw new StampError(
        "FULL",
        "Kortet er fuldt. Bed personalet indløse din belønning.",
      );
    }

    // Cooldown gaelder den ubemandede kunde-QR, ikke personalet ved disken
    // (skipCooldown) eller manuelle stempler.
    const enforceCooldown = !opts.skipCooldown && opts.method !== "MANUAL";
    const cooldownCutoff = new Date(
      now.getTime() - business.stampCooldownMin * 60000,
    );

    // Venlig fejl FOER stempling (giver praecis ventetid). Selve haandhaevelsen
    // sker atomisk i optaellingen nedenfor, saa den ikke kan omgaas i et race.
    if (enforceCooldown && cc.lastStampAt) {
      const minutesSince =
        (now.getTime() - cc.lastStampAt.getTime()) / 60000;
      if (minutesSince < business.stampCooldownMin) {
        const wait = Math.ceil(business.stampCooldownMin - minutesSince);
        throw new StampError(
          "COOLDOWN",
          `Du har lige fået et stempel. Prøv igen om ${wait} min.`,
        );
      }
    }

    // Kampagner: dobbeltstempel (velkomstbonus haandteres atomisk nedenfor).
    const active = cc.card.campaigns.filter(
      (c) => c.startsAt <= now && c.endsAt >= now,
    );
    const baseIncrement = active.some((c) => c.type === "DOUBLE_STAMP") ? 2 : 1;
    const hasWelcome = active.some((c) => c.type === "WELCOME_BONUS");
    // Antal stempler paa denne scanning (personalet vaelger, fx tre kaffe = 3).
    const qty = Math.max(1, Math.min(20, Math.floor(opts.count ?? 1)));
    const scanIncrement = baseIncrement * qty;

    // Atomisk optaelling: opdaterer kun hvis kortet ikke er fuldt OG cooldown
    // er ovre. Forhindrer baade tabte stempler OG at to samtidige kunde-QR-
    // stempler begge slipper forbi cooldown (check-then-act-racet).
    const applied = await tx.customerCard.updateMany({
      where: {
        id: cc.id,
        stamps: { lt: required },
        ...(enforceCooldown
          ? {
              OR: [
                { lastStampAt: null },
                { lastStampAt: { lt: cooldownCutoff } },
              ],
            }
          : {}),
      },
      data: {
        stamps: { increment: scanIncrement },
        // Livstidstaelleren foelger med op ATOMISK i samme guardede update, saa
        // den aldrig kan komme ud af trit med de faktiske stempler.
        lifetimeStamps: { increment: scanIncrement },
        lastStampAt: now,
      },
    });
    if (applied.count === 0) {
      // Skeln mellem fuldt kort og tabt cooldown-race for en god fejlbesked.
      const fresh = await tx.customerCard.findUnique({
        where: { id: cc.id },
        select: { stamps: true },
      });
      if ((fresh?.stamps ?? 0) >= required) {
        throw new StampError(
          "FULL",
          "Kortet er fuldt. Bed personalet indløse din belønning.",
        );
      }
      throw new StampError(
        "COOLDOWN",
        "Du har lige fået et stempel. Prøv igen om lidt.",
      );
    }

    // Velkomstbonus: kun den allerfoerste stempling (0 -> baseIncrement) faar
    // den. Row-laasen fra optaellingen serialiserer samtidige stemplinger, saa
    // kun een kan matche stamps === baseIncrement -> ingen dobbelt bonus.
    let increment = scanIncrement;
    if (hasWelcome && cc.completedCount === 0) {
      const bonus = await tx.customerCard.updateMany({
        where: { id: cc.id, stamps: scanIncrement },
        data: {
          stamps: { increment: 1 },
          lifetimeStamps: { increment: 1 },
        },
      });
      if (bonus.count === 1) increment += 1;
    }

    const updated = await tx.customerCard.findUnique({
      where: { id: cc.id },
      select: { stamps: true },
    });
    const newStamps = Math.min(updated?.stamps ?? cc.stamps + increment, required);
    const rewardReady = newStamps >= required;
    // Livstid EFTER denne transaktion (loebende sum). Kortet nulstilles, men denne
    // goer aldrig; gemmes ogsaa paa selve transaktionen til milepaels-analyse.
    const lifetimeStamps = cc.lifetimeStamps + increment;

    await tx.stamp.create({
      data: {
        customerCardId: cc.id,
        businessId: business.id,
        method: opts.method,
        tokenJti: opts.tokenJti ?? null,
        multiplier: increment,
        staffUserId: opts.staffUserId ?? null,
        staffDeviceId: opts.staffDeviceId ?? null,
        lifetimeAfter: lifetimeStamps,
        filledCard: rewardReady,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId: business.id,
        action: "STAMP",
        ip: opts.ip ?? null,
        detail: {
          serial: cc.serial,
          method: opts.method,
          increment,
          stamps: newStamps,
          required,
        },
      },
    });

    return {
      businessId: business.id,
      serial: cc.serial,
      stamps: newStamps,
      required,
      rewardReady,
      justCompleted: rewardReady,
      increment,
      lifetimeStamps,
      webhookUrl: business.webhookUrl,
      apiKey: business.apiKey,
    };
  });

  // Bivirkninger efter commit.
  await flagIfAnomalous(
    result.businessId,
    opts.customerCardId,
    opts.ip ?? null,
    result.serial,
  );
  runAfterResponse(() =>
    fireWebhook(
      {
        id: result.businessId,
        webhookUrl: result.webhookUrl,
        apiKey: result.apiKey,
      },
      result.justCompleted ? "reward.ready" : "stamp.created",
      {
        serial: result.serial,
        stamps: result.stamps,
        required: result.required,
        rewardReady: result.rewardReady,
      },
    ),
  );
  pushWallet(opts.customerCardId);

  return {
    serial: result.serial,
    stamps: result.stamps,
    required: result.required,
    rewardReady: result.rewardReady,
    justCompleted: result.justCompleted,
    increment: result.increment,
    lifetimeStamps: result.lifetimeStamps,
  };
}

/**
 * Fortryd sidste stempel (personalet kom til at taste for mange gange).
 * Sletter den nyeste Stamp og traekker dens multiplier fra taelleren. Kan kaldes
 * gentagne gange for at rulle flere fejl-tryk tilbage.
 */
export async function undoLastStamp(
  opts: {
    customerCardId: string;
    ip?: string | null;
  },
  db: typeof prisma = prisma,
): Promise<{
  serial: string;
  stamps: number;
  required: number;
  rewardReady: boolean;
  lifetimeStamps: number;
}> {
  const res = await db.$transaction(async (tx) => {
    // Laas kortraekken foerst, saa undo er fuldt serialiseret mod samtidige
    // stemplinger: applyStamp's guardede update blokerer paa laasen, indtil vi
    // committer. Dermed kan et samtidigt stempel ikke gaa tabt.
    await tx.$queryRaw`SELECT id FROM "CustomerCard" WHERE id = ${opts.customerCardId} FOR UPDATE`;
    const cc = await tx.customerCard.findUnique({
      where: { id: opts.customerCardId },
      include: { card: true },
    });
    if (!cc) throw new StampError("NOT_FOUND", "Kortet blev ikke fundet.");

    const last = await tx.stamp.findFirst({
      where: { customerCardId: cc.id },
      orderBy: { createdAt: "desc" },
    });
    if (!last) {
      throw new StampError("NOT_FOUND", "Der er ikke noget stempel at fortryde.");
    }

    await tx.stamp.delete({ where: { id: last.id } });
    // Klamp mod den LAASTE (levende) vaerdi, saa intet gaar negativt. Fordi
    // raekken er laast, er snapshottet lig den levende vaerdi.
    const removed = Math.min(last.multiplier, cc.stamps);
    const lifeRemoved = Math.min(last.multiplier, cc.lifetimeStamps);

    // Saet lastStampAt tilbage til det forrige stempel (eller nul), saa
    // cooldown ogsaa ruller tilbage.
    const prev = await tx.stamp.findFirst({
      where: { customerCardId: cc.id },
      orderBy: { createdAt: "desc" },
    });
    // RELATIVE decrements (ikke absolut fra snapshot): taelleren traekkes fra den
    // LEVENDE raekke, saa den forbliver lig sum(Stamp.multiplier). Ingen tabt
    // opdatering, selv hvis et stempel skulle naa ind (laasen forhindrer det her).
    const updated = await tx.customerCard.update({
      where: { id: cc.id },
      data: {
        stamps: { decrement: removed },
        lifetimeStamps: { decrement: lifeRemoved },
        lastStampAt: prev?.createdAt ?? null,
      },
      select: { stamps: true, lifetimeStamps: true },
    });

    const required = cc.card.stampsRequired;
    await tx.auditLog.create({
      data: {
        businessId: cc.card.businessId,
        action: "UNDO_STAMP",
        ip: opts.ip ?? null,
        detail: { serial: cc.serial, removed, stamps: updated.stamps },
      },
    });

    return {
      serial: cc.serial,
      stamps: updated.stamps,
      required,
      rewardReady: updated.stamps >= required,
      lifetimeStamps: updated.lifetimeStamps,
    };
  });

  pushWallet(opts.customerCardId);
  return res;
}

/** Indløsning kræver PIN (tjekkes af kalderen). Nulstiller til ny runde. */
export async function redeemReward(opts: {
  customerCardId: string;
  ip?: string | null;
}): Promise<{
  serial: string;
  completedCount: number;
  stamps: number;
  required: number;
}> {
  const res = await prisma.$transaction(async (tx) => {
    const cc = await tx.customerCard.findUnique({
      where: { id: opts.customerCardId },
      include: { card: { include: { business: true } } },
    });
    if (!cc) throw new StampError("NOT_FOUND", "Kortet blev ikke fundet.");
    const required = cc.card.stampsRequired;

    // Atomisk: nulstil kun hvis kortet stadig er fuldt. To samtidige
    // indløsninger paa samme kort giver kun een indløsning. Vi TRAEKKER
    // "required" fra (ikke nul), saa et evt. ekstra stempel fra en kampagne
    // (fx dobbeltstempel paa sidste felt) baeres over til naeste runde.
    const reset = await tx.customerCard.updateMany({
      where: { id: cc.id, stamps: { gte: required } },
      data: { stamps: { decrement: required }, completedCount: { increment: 1 } },
    });
    if (reset.count === 0) {
      throw new StampError("FULL", "Kortet er ikke fuldt endnu.");
    }

    await tx.redemption.create({ data: { customerCardId: cc.id } });
    const updated = await tx.customerCard.findUnique({
      where: { id: cc.id },
      select: { completedCount: true, stamps: true },
    });
    const completedCount = updated?.completedCount ?? cc.completedCount + 1;
    // Rest efter indløsning: normalt 0, men et evt. kampagne-overskud (fx
    // dobbeltstempel paa sidste felt) baeres over, saa klienten faar sandheden
    // og ikke behoever et ekstra opslag.
    const stampsAfter = updated?.stamps ?? Math.max(0, cc.stamps - required);
    await tx.auditLog.create({
      data: {
        businessId: cc.card.business.id,
        action: "REDEEM",
        ip: opts.ip ?? null,
        detail: { serial: cc.serial, completedCount },
      },
    });
    return {
      serial: cc.serial,
      completedCount,
      stamps: stampsAfter,
      required,
      businessId: cc.card.business.id,
      webhookUrl: cc.card.business.webhookUrl,
      apiKey: cc.card.business.apiKey,
    };
  });

  runAfterResponse(() =>
    fireWebhook(
      { id: res.businessId, webhookUrl: res.webhookUrl, apiKey: res.apiKey },
      "reward.redeemed",
      { serial: res.serial, completedCount: res.completedCount },
    ),
  );
  pushWallet(opts.customerCardId);
  return {
    serial: res.serial,
    completedCount: res.completedCount,
    stamps: res.stamps,
    required: res.required,
  };
}

async function flagIfAnomalous(
  businessId: string,
  customerCardId: string,
  ip: string | null,
  serial: string,
) {
  try {
    const { flagged, reason } = await trackStampAnomaly({
      businessId,
      customerCardId,
      ip,
    });
    if (flagged) {
      await prisma.auditLog.create({
        data: {
          businessId,
          action: "FLAGGED",
          ip,
          detail: {
            reason:
              reason === "card-volume"
                ? "Usaedvanligt mange stempler paa samme kort inden for en time"
                : "Samme IP stempler mange forskellige kort paa tvaers af flere butikker",
            code: reason,
            serial,
          },
        },
      });
    }
  } catch {
    // Anomali-sporing må aldrig blokere et stempel.
  }
}

/**
 * Koer baggrundsarbejde EFTER svaret er sendt, men hold funktionen i live, til
 * det er faerdigt.
 *
 * VIGTIGT: tidligere blev Wallet-push og webhooks kaldt "fire-and-forget"
 * (void ...(...)), men paa Vercel fryses/afsluttes funktionen, saa snart svaret
 * er sendt, saa det uafventede arbejde blev DRAEBT, foer det naaede frem.
 * Resultat: stemplet laa i databasen, men kortet i kundens Wallet blev aldrig
 * opdateret (og webhooks naaede ikke ud). next/server "after" udskyder arbejdet
 * til efter svaret OG holder funktionen i live (Vercel waitUntil), saa det altid
 * naar frem, uden at forsinke selve stemplingen.
 */
function runAfterResponse(task: () => Promise<unknown>) {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error("Baggrundsopgave fejlede", err);
    }
  };
  try {
    after(run);
  } catch {
    // Uden en request-kontekst (fx et script): koer den bare direkte.
    void run();
  }
}

/** Skub Wallet-opdatering (kun naar flaget er slaaet til). */
function pushWallet(customerCardId: string) {
  if (!WALLET_ENABLED) return;
  runAfterResponse(async () => {
    const { pushWalletUpdate } = await import("./wallet/apns");
    await pushWalletUpdate(customerCardId);
  });
}
