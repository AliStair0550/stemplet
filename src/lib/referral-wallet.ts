import "server-only";
import { prisma } from "./prisma";
import { APP_URL } from "./env";
import { referralShareUrl } from "./referral-text";
import type { ReferralPassInfo } from "./wallet/referral-fields";

type Db = typeof prisma;

/**
 * Henvisningsoplysninger til kundens Wallet-kort, eller null for et rent
 * stempelkort (butikken uden modulet, eller kunden uden kode). null betyder, at
 * passet bygges praecis som foer.
 */
export async function loadReferralPassInfo(
  cc: {
    id: string;
    referralCode: string | null;
    card: { business: { id: string; slug: string; referralsEnabled: boolean } };
  },
  now: Date = new Date(),
  db: Db = prisma,
): Promise<ReferralPassInfo | null> {
  const b = cc.card.business;
  if (!b.referralsEnabled || !cc.referralCode) return null;

  const [rule, rewards, lastRedeemed, referralsDone] = await Promise.all([
    db.referralRule.findUnique({ where: { businessId: b.id }, select: { termsLine: true } }),
    db.reward.findMany({
      where: { cardId: cc.id, status: "AVAILABLE", expiresAt: { gt: now } },
      orderBy: { createdAt: "asc" },
      select: { type: true, value: true, createdAt: true },
    }),
    db.reward.findFirst({
      where: { cardId: cc.id, status: "REDEEMED" },
      orderBy: { redeemedAt: "desc" },
      select: { redeemedAt: true },
    }),
    db.referral.count({ where: { referrerCardId: cc.id, status: "REWARDED" } }),
  ]);

  // Besked kun naar seneste aendring var en ny beloenning (ikke en indloesning).
  const newest = rewards.at(-1)?.createdAt?.getTime() ?? 0;
  const redeemed = lastRedeemed?.redeemedAt?.getTime() ?? 0;

  return {
    code: cc.referralCode,
    shareUrl: referralShareUrl(APP_URL, b.slug, cc.referralCode),
    pageUrl: `${APP_URL}/henvisninger/${b.slug}`,
    termsLine: rule?.termsLine ?? null,
    referralsDone,
    rewards: rewards.map((r) => ({ type: r.type, value: r.value })),
    announce: newest > redeemed,
  };
}
