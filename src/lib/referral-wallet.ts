import "server-only";
import { prisma } from "./prisma";
import { APP_URL } from "./env";
import { referralShareUrl, rewardPhrase } from "./referral-text";
import type { ReferralPassInfo } from "./wallet/referral-fields";
import { assignReferralCode } from "./referral";

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
  if (!b.referralsEnabled) return null;
  // Uden en gemt regel er henvisningssiden lukket (vennen kan ikke tilmelde sig),
  // saa kortet maa ikke vise "Del med en ven" endnu, og ingen koder uddeles.
  const rule = await db.referralRule.findUnique({
    where: { businessId: b.id },
    select: {
      termsLine: true,
      newCustomerRewardType: true,
      newCustomerRewardValue: true,
      referrerRewardType: true,
      referrerRewardValue: true,
    },
  });
  if (!rule) return null;
  // Kortholdere fra foer henvisninger blev slaaet til har ingen kode endnu. Giv
  // dem en nu, saa koden kommer paa kortet ved den opdatering, der netop sker
  // (ellers foerst naar kunden selv aabner butikssiden).
  const code = cc.referralCode ?? (await assignReferralCode({ customerCardId: cc.id }, db).catch(() => null));
  if (!code) return null;

  const [rewards, lastRedeemed, referralsDone, referralsMade] = await Promise.all([
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
    // Venner, der har hentet kortet via kunden (ogsaa dem, der ikke har vaeret der endnu).
    db.referral.count({ where: { referrerCardId: cc.id, status: { in: ["CREATED", "VISITED", "REWARDED"] } } }),
  ]);

  // Besked kun naar seneste aendring var en ny beloenning (ikke en indloesning).
  const newest = rewards.at(-1)?.createdAt?.getTime() ?? 0;
  const redeemed = lastRedeemed?.redeemedAt?.getTime() ?? 0;

  return {
    code,
    shareUrl: referralShareUrl(APP_URL, b.slug, code),
    pageUrl: `${APP_URL}/k/${b.slug}?del=1`,
    termsLine: rule.termsLine ?? null,
    newCustomerReward: rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue),
    referrerReward: rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue),
    referralsDone,
    referralsMade,
    rewards: rewards.map((r) => ({ type: r.type, value: r.value })),
    announce: newest > redeemed,
  };
}
