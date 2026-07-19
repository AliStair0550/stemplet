import "server-only";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "../prisma";
import { PLAN_LIMITS } from "../plans";
import { buildPass } from "./pass";

/** Loader kundekort med alt, Wallet-passet skal bruge. */
export function loadCCForWallet(serial: string) {
  return prisma.customerCard.findUnique({
    where: { serial },
    include: { card: { include: { business: true } } },
  });
}

type LoadedCC = NonNullable<Awaited<ReturnType<typeof loadCCForWallet>>>;

export function buildPkpass(cc: LoadedCC): Promise<Buffer> {
  const b = cc.card.business;
  return buildPass({
    serial: cc.serial,
    authToken: cc.authToken,
    businessName: b.name,
    primaryColor: b.primaryColor,
    textColor: b.textColor,
    logoUrl: b.logoUrl,
    stampIcon: cc.card.stampIcon,
    rewardText: cc.card.rewardText,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    lifetimeStamps: cc.lifetimeStamps,
    completedCount: cc.completedCount,
    showPoweredBy: PLAN_LIMITS[b.plan].showPoweredBy,
    latitude: b.latitude,
    longitude: b.longitude,
  });
}

/**
 * Ruller en pass-STRUKTUR-aendring ud til kort, der allerede ligger i Wallet:
 * pusher en tom APNs-notifikation til hvert registreret kort, saa iOS henter det
 * opdaterede pass (som altid bygges friskt i pass-GET'en). Bruges efter fx en
 * aendring af header/farver, hvor der ikke er sket en stempling til at trigge push.
 * Returnerer antal kort, der blev forsoegt pushet.
 */
export async function pushAllWalletPasses(): Promise<{ pushed: number }> {
  const regs = await prisma.walletRegistration.findMany({
    select: { customerCardId: true },
    distinct: ["customerCardId"],
  });
  const { pushWalletUpdate } = await import("./apns");
  let pushed = 0;
  for (const r of regs) {
    await pushWalletUpdate(r.customerCardId);
    pushed += 1;
  }
  return { pushed };
}

/** Tjekker Apples "Authorization: ApplePass <token>"-header i konstant tid. */
export function checkPassAuth(
  authHeader: string | null,
  authToken: string,
): boolean {
  if (!authHeader) return false;
  const expected = Buffer.from(`ApplePass ${authToken}`);
  const got = Buffer.from(authHeader);
  // timingSafeEqual kraever ens laengde, saa laengde-tjek foerst (ikke hemmeligt).
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}
