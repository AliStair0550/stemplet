import "server-only";
import type { StampMethod } from "@prisma/client";
import { prisma } from "./prisma";
import { trackIpStamp } from "./security";
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
 * Kernen. Al stempel-logik sker paa serveren, aldrig paa klienten.
 * Tjekker cooldown, laegger kampagne-multiplier paa, haandterer fuldt kort,
 * skriver Stamp + AuditLog og skubber Wallet-opdatering.
 */
export async function applyStamp(opts: {
  customerCardId: string;
  method: StampMethod;
  tokenJti?: string;
  ip?: string | null;
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

    // Fuldt kort: bloker flere stempler indtil beloenningen er indloest.
    if (cc.stamps >= required) {
      throw new StampError(
        "FULL",
        "Kortet er fuldt. Bed personalet indloese din beloenning.",
      );
    }

    // Rate limit pr. kunde (undtagen manuelt stempel fra personalet).
    if (opts.method !== "MANUAL" && cc.lastStampAt) {
      const minutesSince =
        (now.getTime() - cc.lastStampAt.getTime()) / 60000;
      if (minutesSince < business.stampCooldownMin) {
        const wait = Math.ceil(business.stampCooldownMin - minutesSince);
        throw new StampError(
          "COOLDOWN",
          `Du har lige faaet et stempel. Proev igen om ${wait} min.`,
        );
      }
    }

    // Kampagner: dobbeltstempel og velkomstbonus.
    const active = cc.card.campaigns.filter(
      (c) => c.startsAt <= now && c.endsAt >= now,
    );
    let increment = active.some((c) => c.type === "DOUBLE_STAMP") ? 2 : 1;
    const hasWelcome = active.some((c) => c.type === "WELCOME_BONUS");
    if (hasWelcome) {
      const priorStamps = await tx.stamp.count({
        where: { customerCardId: cc.id },
      });
      const isFirstEver = priorStamps === 0 && cc.completedCount === 0;
      if (isFirstEver) increment += 1;
    }

    const newStamps = Math.min(cc.stamps + increment, required);
    const rewardReady = newStamps >= required;

    await tx.stamp.create({
      data: {
        customerCardId: cc.id,
        method: opts.method,
        tokenJti: opts.tokenJti ?? null,
        multiplier: increment,
      },
    });

    await tx.customerCard.update({
      where: { id: cc.id },
      data: { stamps: newStamps, lastStampAt: now },
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
    };
  });

  // Bivirkninger efter commit.
  await flagIfAnomalous(result.businessId, opts.ip ?? null, result.serial);
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

/** Indloesning kraever PIN (tjekkes af kalderen). Nulstiller til ny runde. */
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
    if (cc.stamps < cc.card.stampsRequired) {
      throw new StampError("FULL", "Kortet er ikke fuldt endnu.");
    }

    await tx.redemption.create({ data: { customerCardId: cc.id } });
    const updated = await tx.customerCard.update({
      where: { id: cc.id },
      data: { stamps: 0, completedCount: { increment: 1 } },
    });
    await tx.auditLog.create({
      data: {
        businessId: cc.card.business.id,
        action: "REDEEM",
        ip: opts.ip ?? null,
        detail: { serial: cc.serial, completedCount: updated.completedCount },
      },
    });
    return { serial: cc.serial, completedCount: updated.completedCount };
  });

  void pushWallet(opts.customerCardId);
  return res;
}

async function flagIfAnomalous(
  businessId: string,
  ip: string | null,
  serial: string,
) {
  try {
    const { count, flagged } = await trackIpStamp(ip);
    if (flagged) {
      await prisma.auditLog.create({
        data: {
          businessId,
          action: "FLAGGED",
          ip,
          detail: {
            reason: "Mange stempler fra samme IP inden for en time",
            count,
            serial,
          },
        },
      });
    }
  } catch {
    // Anomali-sporing maa aldrig blokere et stempel.
  }
}

/** Skub Wallet-opdatering (kun naar flaget er slaaet til). Non-blocking. */
async function pushWallet(customerCardId: string) {
  if (!WALLET_ENABLED) return;
  try {
    const { pushWalletUpdate } = await import("./wallet/apns");
    await pushWalletUpdate(customerCardId);
  } catch (err) {
    console.error("Wallet-push fejlede", err);
  }
}
