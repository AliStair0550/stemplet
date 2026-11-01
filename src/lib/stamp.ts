import "server-only";
import { after } from "next/server";
import type { StampMethod } from "@prisma/client";
import { prisma } from "./prisma";
import { trackStampAnomaly } from "./security";
import { fireWebhook } from "./integrations";
import { WALLET_ENABLED } from "./env";
import { generateSerial, generateAuthToken } from "./ids";
import { maybeFireTrialMilestones, signupBlockReason } from "./billing";
import { captureServerError } from "./sentry";
import { expireBusinessStats } from "./stats";

/**
 * Opretter EET kundekort race-sikkert, dedup'et pr. enhed. Der er intet loft paa
 * antal kortholdere (prismodellen: ubegraenset), saa ingen optaelling eller laas.
 */
export async function createCardholderAtomically(
  businessId: string,
  cardId: string,
  // db er 3. parameter, saa unit-tests kan injicere en fake.
  db: typeof prisma = prisma,
  // Enheds-id (stemplet_device-cookie). Sat -> dedup pr. (kort, enhed), saa et
  // dobbelt-tryk/retry ikke opretter to kort. Null -> som foer (ingen dedup).
  deviceId: string | null = null,
): Promise<{ id: string; serial: string; authToken: string; isNew: boolean }> {
  const select = { id: true, serial: true, authToken: true } as const;
  // isNew: kortet blev oprettet af DETTE kald. Et dobbelttryk fra samme enhed
  // faar det samme kort tilbage med isNew=false, saa velkomststempel og
  // henvisning kun gives een gang.
  const reused = <T extends object>(c: T) => ({ ...c, isNew: false });
  const fresh = <T extends object>(c: T) => ({ ...c, isNew: true });
  // businessId saettes altid (ogsaa ved selv-scan), saa kortet kan findes i
  // kassens soegning, til gendannelse og i henvisninger.
  const newData = () => ({
    cardId,
    businessId,
    serial: generateSerial(),
    authToken: generateAuthToken(),
    deviceId,
  });

  // Opret EET kort, dedup'et pr. enhed: har enheden allerede et kort til dette
  // kort, genbruges det. Vinder to samtidige oprettelser kapløbet, fanger unique-
  // constrainten ([cardId, deviceId]) den ene (P2002), og vi genfinder i stedet.
  const createDeduped = async () => {
    if (deviceId) {
      const found = await db.customerCard.findFirst({
        where: { cardId, deviceId },
        select,
      });
      if (found) return reused(found);
    }
    try {
      return fresh(await db.customerCard.create({ data: newData(), select }));
    } catch (e) {
      if (deviceId && (e as { code?: string }).code === "P2002") {
        const found = await db.customerCard.findFirst({
          where: { cardId, deviceId },
          select,
        });
        if (found) return reused(found);
      }
      throw e;
    }
  };

  const card = await createDeduped();
  if (card.isNew) expireBusinessStats(businessId);
  return card;
}

/**
 * Opretter et nyt kundekort for butikkens aktive kort. Bruges naar en ny kunde
 * scanner stempel-QR'en: kortet dannes automatisk, saa foerste stempel kan
 * gives med det samme uden en mellemskaerm. Returnerer "full", hvis butikken
 * har ramt sit gratis-loft.
 */
export async function createCustomerCard(
  businessId: string,
  // Enheds-cookien, hvis telefonen har en: et genforsoeg fra samme telefon faar
  // saa det samme kort i stedet for et nyt (dedup pr. kort og enhed).
  deviceId: string | null = null,
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

  const created = await createCardholderAtomically(businessId, business.cards[0].id, prisma, deviceId);
  // Fyr kortholder-taerskler (80-varsel / 100-krydsning), fire-once, efter svar.
  await maybeFireTrialMilestones(businessId);
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

/**
 * Butikkens raekke uden billederne. Logo, kortbillede og plakatfoto ligger som
 * tekst i raekken (op til ca. 2 MB pr. butik), og stempel, indloesning og kassens
 * opslag bruger dem ikke. Uden dem er hvert stempel en lille forespoergsel.
 * Wallet-passet og webkortet henter billederne for sig.
 */
export const BUSINESS_NO_IMAGES = {
  omit: { logoUrl: true, cardArtwork: true, cardArt: true, posterPhoto: true },
} as const;

/** Live-opslag af kort via serial (webkort) med virksomhed og skabelon. */
export function loadCardBySerial(serial: string) {
  return prisma.customerCard.findUnique({
    where: { serial },
    include: { card: { include: { business: BUSINESS_NO_IMAGES, campaigns: true } } },
  });
}

/**
 * Kortets id, hvis kortet hoerer til butikken, ellers null. Eet lille opslag til
 * kassens og API'ets ejerskabstjek (foer: hele kortet med butik og kampagner,
 * 3-4 opslag, kun for at sammenligne butikken).
 */
export async function cardIdInBusiness(serial: string, businessId: string): Promise<string | null> {
  const cc = await prisma.customerCard.findFirst({
    where: { serial, card: { businessId } },
    select: { id: true },
  });
  return cc?.id ?? null;
}

export function loadCardByToken(authToken: string) {
  return prisma.customerCard.findUnique({
    where: { authToken },
    include: { card: { include: { business: BUSINESS_NO_IMAGES } } },
  });
}

/**
 * Er der en aktiv "stempel ved afhentning"-kampagne paa kortet lige nu? Bruges
 * baade i claim-flowet og selvbetjenings-scan til at give en ny kunde 1 stempel
 * med det samme, naar kortet hentes i perioden.
 */
export async function hasActivePickupStamp(
  cardId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const c = await prisma.campaign.findFirst({
    where: {
      cardId,
      type: "PICKUP_STAMP",
      startsAt: { lte: now },
      endsAt: { gte: now },
    },
    select: { id: true },
  });
  return c != null;
}

/**
 * Faar et nyt kort 1 stempel, naar det hentes? Ja, naar butikken har slaaet
 * "Første stempel med det samme" til, eller en "stempel ved afhentning"-kampagne
 * koerer. Saa er kunden i gang, uanset om kortet hentes ved kassen eller hjemme.
 */
export async function stampsOnPickup(cardId: string, now: Date = new Date()): Promise<boolean> {
  const card = await prisma.card.findUnique({
    where: { id: cardId },
    select: { business: { select: { welcomeStampEnabled: true } } },
  });
  if (card?.business.welcomeStampEnabled) return true;
  return hasActivePickupStamp(cardId, now);
}

/**
 * Ren beregning af, hvor mange stempler EEN scanning giver: en aktiv
 * dobbeltstempel-kampagne fordobler, og personalet kan vaelge et antal (fx tre
 * kaffe = 3, klampet til 1..20). Uden I/O, saa multiplier-logikken kan
 * enhedstestes. hasWelcome siger, om en velkomstbonus-kampagne er aktiv (selve
 * bonussen gives atomisk i applyStamp).
 */
export function computeScanIncrement(
  campaigns: { type: string; startsAt: Date; endsAt: Date }[],
  now: Date,
  count?: number,
): {
  baseIncrement: number;
  hasWelcome: boolean;
  qty: number;
  scanIncrement: number;
} {
  const active = campaigns.filter((c) => c.startsAt <= now && c.endsAt >= now);
  const baseIncrement = active.some((c) => c.type === "DOUBLE_STAMP") ? 2 : 1;
  const hasWelcome = active.some((c) => c.type === "WELCOME_BONUS");
  const qty = Math.max(1, Math.min(20, Math.floor(count ?? 1)));
  return { baseIncrement, hasWelcome, qty, scanIncrement: baseIncrement * qty };
}

/** Svaret for et stempel, der allerede er givet med denne noegle (eller null). */
async function replayStamp(customerCardId: string, key: string): Promise<StampResult | null> {
  const s = await prisma.stamp.findUnique({
    where: { customerCardId_idempotencyKey: { customerCardId, idempotencyKey: key } },
    select: {
      multiplier: true,
      lifetimeAfter: true,
      customerCard: { select: { serial: true, stamps: true, lifetimeStamps: true, card: { select: { stampsRequired: true } } } },
    },
  });
  if (!s) return null;
  const required = s.customerCard.card.stampsRequired;
  const stamps = Math.min(s.customerCard.stamps, required);
  return {
    serial: s.customerCard.serial,
    stamps,
    required,
    rewardReady: stamps >= required,
    justCompleted: false,
    increment: s.multiplier,
    lifetimeStamps: s.lifetimeAfter ?? s.customerCard.lifetimeStamps,
  };
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
  /** Kassens noegle for trykket. Samme noegle giver aldrig to stempler (R10). */
  idempotencyKey?: string | null;
}): Promise<StampResult> {
  const now = new Date();
  const key = opts.idempotencyKey || null;

  // Samme tryk igen (retry efter tabt svar) fanges af transaktionen: den unikke
  // noegle paa Stamp (P2002) eller et kort, der nu er fuldt (StampError), giver
  // svaret fra det stempel, der allerede blev givet (se catch nedenfor). Intet
  // ekstra opslag paa den normale vej.

  const result = await prisma.$transaction(async (tx) => {
    const cc = await tx.customerCard.findUnique({
      where: { id: opts.customerCardId },
      include: { card: { include: { business: BUSINESS_NO_IMAGES, campaigns: true } } },
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
    // Kun Henvisninger (Stemplet slaaet fra): ingen stempler.
    if (!business.stampsEnabled) {
      throw new StampError("INACTIVE", "Butikken bruger ikke stempelkort.");
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

    // Kampagne-multiplier + antal paa denne scanning (ren beregning, se
    // computeScanIncrement). Velkomstbonus haandteres atomisk nedenfor.
    const { hasWelcome, scanIncrement } = computeScanIncrement(
      cc.card.campaigns,
      now,
      opts.count,
    );

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
        // Kortet er aendret i samme transaktion (B4): doer pushet efter svaret,
        // sender den daglige cron det igen.
        passUpdatedAt: now,
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
        idempotencyKey: key,
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
  }).catch(async (e) => {
    // To samtidige forsoeg med samme noegle: det andet ruller tilbage paa den
    // unikke noegle (eller ser et fuldt kort). Svar med det stempel, det foerste gav.
    if (key && ((e as { code?: string }).code === "P2002" || e instanceof StampError)) {
      const replay = await replayStamp(opts.customerCardId, key);
      if (replay) return { replay };
    }
    throw e;
  });
  if ("replay" in result) return result.replay;

  // Bivirkninger efter commit. Anomali-tjekket (flere Redis-kald) maa ikke
  // forsinke kassen: det paavirker ikke svaret, saa det koerer bagefter.
  runAfterResponse(() =>
    flagIfAnomalous(
      result.businessId,
      opts.customerCardId,
      opts.ip ?? null,
      result.serial,
    ),
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
  expireBusinessStats(result.businessId);

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
    /** Kassens noegle for trykket. Samme noegle fortryder kun een gang (R10). */
    idempotencyKey?: string | null;
  },
  db: typeof prisma = prisma,
): Promise<{
  serial: string;
  stamps: number;
  required: number;
  rewardReady: boolean;
  lifetimeStamps: number;
}> {
  const key = opts.idempotencyKey || null;
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

    // Samme tryk igen (retry efter tabt svar): fortrydelsen er allerede sket.
    // Raekken er laast, saa to samtidige forsoeg kan ikke begge slippe forbi.
    if (key && cc.lastUndoKey === key) {
      const required = cc.card.stampsRequired;
      return {
        serial: cc.serial,
        stamps: cc.stamps,
        required,
        rewardReady: cc.stamps >= required,
        lifetimeStamps: cc.lifetimeStamps,
        replayed: true,
        businessId: cc.card.businessId,
      };
    }

    const last = await tx.stamp.findFirst({
      where: { customerCardId: cc.id },
      orderBy: { createdAt: "desc" },
    });
    if (!last) {
      throw new StampError("NOT_FOUND", "Der er ikke noget stempel at fortryde.");
    }
    // Stemplet hoerer til en runde, der allerede er indloest: fortryd ville
    // fjerne et stempel, belønningen er givet for, og faa taellerne ud af trit.
    // Kortet starter forfra efter en indloesning, saa der er intet at fortryde.
    const lastRedeem = await tx.redemption.findFirst({
      where: { customerCardId: cc.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (cc.stamps <= 0 || (lastRedeem && lastRedeem.createdAt >= last.createdAt)) {
      throw new StampError(
        "NOT_FOUND",
        "Stemplet hører til en belønning, der er givet. Det kan ikke fortrydes.",
      );
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
        lastUndoKey: key,
        passUpdatedAt: new Date(),
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
      replayed: false,
      businessId: cc.card.businessId,
    };
  });

  const { replayed, businessId, ...out } = res;
  if (!replayed) {
    pushWallet(opts.customerCardId);
    expireBusinessStats(businessId);
  }
  return out;
}

type RedeemStampsResult = {
  serial: string;
  completedCount: number;
  stamps: number;
  required: number;
};

/** Svaret for en indloesning, der allerede er sket med denne noegle (eller null). */
async function replayRedeem(customerCardId: string, key: string): Promise<RedeemStampsResult | null> {
  const r = await prisma.redemption.findUnique({
    where: { customerCardId_idempotencyKey: { customerCardId, idempotencyKey: key } },
    select: {
      customerCard: { select: { serial: true, completedCount: true, stamps: true, card: { select: { stampsRequired: true } } } },
    },
  });
  if (!r) return null;
  const cc = r.customerCard;
  return { serial: cc.serial, completedCount: cc.completedCount, stamps: cc.stamps, required: cc.card.stampsRequired };
}

/** Indløsning kræver PIN (tjekkes af kalderen). Nulstiller til ny runde. */
export async function redeemReward(opts: {
  customerCardId: string;
  ip?: string | null;
  /** Kassens noegle for trykket. Samme noegle indloeser aldrig to gange (R10). */
  idempotencyKey?: string | null;
}): Promise<RedeemStampsResult> {
  const key = opts.idempotencyKey || null;
  // Samme tryk igen: kortet er allerede indloest, saa transaktionen fejler med
  // "ikke fuldt" (eller P2002 paa noeglen), og catch svarer med kortets tilstand.

  const res = await prisma.$transaction(async (tx) => {
    const cc = await tx.customerCard.findUnique({
      where: { id: opts.customerCardId },
      include: { card: { include: { business: BUSINESS_NO_IMAGES } } },
    });
    if (!cc) throw new StampError("NOT_FOUND", "Kortet blev ikke fundet.");
    const required = cc.card.stampsRequired;

    // Atomisk: nulstil kun hvis kortet stadig er fuldt. To samtidige
    // indløsninger paa samme kort giver kun een indløsning. Vi TRAEKKER
    // "required" fra (ikke nul), saa et evt. ekstra stempel fra en kampagne
    // (fx dobbeltstempel paa sidste felt) baeres over til naeste runde.
    const reset = await tx.customerCard.updateMany({
      where: { id: cc.id, stamps: { gte: required } },
      data: { stamps: { decrement: required }, completedCount: { increment: 1 }, passUpdatedAt: new Date() },
    });
    if (reset.count === 0) {
      throw new StampError("FULL", "Kortet er ikke fuldt endnu.");
    }

    await tx.redemption.create({ data: { customerCardId: cc.id, idempotencyKey: key } });
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
  }).catch(async (e) => {
    // Samtidigt forsoeg med samme noegle: det andet ruller tilbage paa noeglen
    // eller ser kortet som "ikke fuldt", fordi det foerste lige har indloest.
    if (key && ((e as { code?: string }).code === "P2002" || e instanceof StampError)) {
      const replay = await replayRedeem(opts.customerCardId, key);
      if (replay) return { replay };
    }
    throw e;
  });
  if ("replay" in res) return res.replay;

  runAfterResponse(() =>
    fireWebhook(
      { id: res.businessId, webhookUrl: res.webhookUrl, apiKey: res.apiKey },
      "reward.redeemed",
      { serial: res.serial, completedCount: res.completedCount },
    ),
  );
  pushWallet(opts.customerCardId);
  expireBusinessStats(res.businessId);
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
      // Vercel gemmer kun loggen en time: send til Sentry, saa et kort, der ikke
      // opdaterer, ses foer kunden klager.
      captureServerError(err, { route: "background:stamp" });
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
