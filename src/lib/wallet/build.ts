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
    rewardText: cc.card.rewardText,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    showPoweredBy: PLAN_LIMITS[b.plan].showPoweredBy,
  });
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
