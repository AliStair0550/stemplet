import "server-only";
import type { StampMethod } from "@prisma/client";
import { prisma } from "./prisma";
import { trackStampAnomaly } from "./security";
import { fireWebhook } from "./integrations";
import { WALLET_ENABLED } from "./env";

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
      data: { stamps: { increment: baseIncrement }, lastStampAt: now },
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
    let increment = baseIncrement;
    if (hasWelcome && cc.completedCount === 0) {
      const bonus = await tx.customerCard.updateMany({
        where: { id: cc.id, stamps: baseIncrement },
        data: { stamps: { increment: 1 } },
      });
      if (bonus.count === 1) increment += 1;
    }

    await tx.stamp.create({
      data: {
        customerCardId: cc.id,
        method: opts.method,
        tokenJti: opts.tokenJti ?? null,
        multiplier: increment,
      },
    });

    const after = await tx.customerCard.findUnique({
      where: { id: cc.id },
      select: { stamps: true },
    });
    const newStamps = Math.min(after?.stamps ?? cc.stamps + increment, required);
    const rewardReady = newStamps >= required;

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
  void fireWebhook(
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
  );
  void pushWallet(opts.customerCardId);

  return {
    serial: result.serial,
    stamps: result.stamps,
    required: result.required,
    rewardReady: result.rewardReady,
    justCompleted: result.justCompleted,
    increment: result.increment,
  };
}

/** Indløsning kræver PIN (tjekkes af kalderen). Nulstiller til ny runde. */
export async function redeemReward(opts: {
  customerCardId: string;
  ip?: string | null;
}): Promise<{ serial: string; completedCount: number }> {
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
    const after = await tx.customerCard.findUnique({
      where: { id: cc.id },
      select: { completedCount: true },
    });
    const completedCount = after?.completedCount ?? cc.completedCount + 1;
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
      businessId: cc.card.business.id,
      webhookUrl: cc.card.business.webhookUrl,
      apiKey: cc.card.business.apiKey,
    };
  });

  void fireWebhook(
    { id: res.businessId, webhookUrl: res.webhookUrl, apiKey: res.apiKey },
    "reward.redeemed",
    { serial: res.serial, completedCount: res.completedCount },
  );
  void pushWallet(opts.customerCardId);
  return { serial: res.serial, completedCount: res.completedCount };
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

/** Skub Wallet-opdatering (kun når flaget er slået til). Non-blocking. */
async function pushWallet(customerCardId: string) {
  if (!WALLET_ENABLED) return;
  try {
    const { pushWalletUpdate } = await import("./wallet/apns");
    await pushWalletUpdate(customerCardId);
  } catch (err) {
    console.error("Wallet-push fejlede", err);
  }
}
