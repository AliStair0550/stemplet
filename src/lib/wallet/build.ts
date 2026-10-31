import "server-only";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "../prisma";
import { PLAN_LIMITS } from "../plans";
import { cardTitle } from "../brand";
import { APP_URL } from "../env";
import { buildPass } from "./pass";
import { loadReferralPassInfo } from "../referral-wallet";
import { newsOptOutUrl } from "../news-optout";
import { getRedis, redisConfigured } from "../redis";

/** Loader kundekort med alt, Wallet-passet skal bruge. */
export function loadCCForWallet(serial: string) {
  return prisma.customerCard.findUnique({
    where: { serial },
    include: { card: { include: { business: true } } },
  });
}

type LoadedCC = NonNullable<Awaited<ReturnType<typeof loadCCForWallet>>>;

export async function buildPkpass(cc: LoadedCC): Promise<Buffer> {
  const b = cc.card.business;
  // Henvisninger (null for et rent stempelkort, som saa bygges praecis som foer).
  const referral = await loadReferralPassInfo(cc);
  return buildPass({
    serial: cc.serial,
    authToken: cc.authToken,
    businessName: cardTitle(b),
    primaryColor: b.primaryColor,
    textColor: b.textColor,
    logoUrl: b.logoUrl,
    logoScale: b.logoScale,
    cardHeader: b.cardHeader,
    stampIcon: cc.card.stampIcon,
    rewardText: cc.card.rewardText,
    terms: cc.card.terms,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    lifetimeStamps: cc.lifetimeStamps,
    completedCount: cc.completedCount,
    showPoweredBy: PLAN_LIMITS[b.plan].showPoweredBy,
    latitude: b.latitude,
    longitude: b.longitude,
    referral,
    stampsEnabled: b.stampsEnabled,
    newsText: b.newsText,
    newsOptOut: cc.newsOptOut,
    newsOptOutUrl: newsOptOutUrl(cc.serial),
    // Kortet (faelles design) til iOS 27-plakaten; bruges kun med WALLET_POSTER=true.
    look: {
      style: b.cardStyle,
      artwork: b.cardArtwork,
      art: b.cardArt,
      accent: b.cardAccent,
      actions: b.cardActions,
      bookingUrl: b.bookingUrl,
      cardPageUrl: `${APP_URL}/k/${b.slug}`,
    },
  });
}

/**
 * Ruller en pass-STRUKTUR-aendring ud til kort, der allerede ligger i Wallet:
 * pusher en tom APNs-notifikation til hvert registreret kort, saa iOS henter det
 * opdaterede pass (som altid bygges friskt i pass-GET'en). Bruges efter fx en
 * aendring af header/farver, hvor der ikke er sket en stempling til at trigge push.
 * Returnerer antal kort, der blev forsoegt pushet.
 */
export async function pushAllWalletPasses(opts: { businessId?: string } = {}): Promise<{ pushed: number }> {
  const regs = await prisma.walletRegistration.findMany({
    // Kun een butiks kort (fx efter en aendring af Kortet), ellers alle.
    where: opts.businessId ? { customerCard: { card: { businessId: opts.businessId } } } : undefined,
    select: { customerCardId: true },
    distinct: ["customerCardId"],
  });
  const { pushWalletUpdates } = await import("./apns");
  // Bidder af 500 kort, hver paa EEN forbindelse til Apple med mange samtidige
  // pushes. Foer aabnede hvert kort sin egen forbindelse.
  const ids = regs.map((r) => r.customerCardId);
  for (let i = 0; i < ids.length; i += FANOUT_CHUNK) {
    await pushWalletUpdates(ids.slice(i, i + FANOUT_CHUNK));
  }
  return { pushed: ids.length };
}

const FANOUT_CHUNK = 500;

/**
 * Opdatér alle en butiks kort i Wallet efter en aendring (Design, Regler,
 * pushbesked), men saml hurtige Gem: koerer en udsendelse allerede for butikken,
 * markeres blot, at der skal en til, og den igangvaerende tager en runde mere,
 * naar den er faerdig. Fem Gem i traek giver saa to udsendelser, ikke fem.
 * Uden Redis sendes der bare (som foer).
 */
export async function pushBusinessWalletPasses(businessId: string): Promise<void> {
  if (!redisConfigured()) {
    await pushAllWalletPasses({ businessId });
    return;
  }
  const redis = getRedis();
  const pending = `wallet-fanout:pending:${businessId}`;
  const lock = `wallet-fanout:lock:${businessId}`;
  try {
    await redis.set(pending, "1", { ex: 600 });
    // Laasen udloeber af sig selv, hvis funktionen doer midt i.
    if ((await redis.set(lock, "1", { nx: true, ex: 300 })) !== "OK") return;
  } catch {
    await pushAllWalletPasses({ businessId });
    return;
  }
  try {
    for (let round = 0; round < 5; round++) {
      await redis.del(pending).catch(() => {});
      await pushAllWalletPasses({ businessId });
      if (!(await redis.get(pending).catch(() => null))) break;
    }
  } finally {
    await redis.del(lock).catch(() => {});
  }
  // Et Gem, der kom lige mens laasen blev sluppet, fik ikke laasen: tag det nu.
  if (await redis.get(pending).catch(() => null)) {
    await pushBusinessWalletPasses(businessId);
  }
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
