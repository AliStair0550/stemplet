import "server-only";
import { prisma } from "@/lib/prisma";
import { cardTitle } from "@/lib/brand";
import { findReferrerByCode } from "@/lib/referral-signup";
import { firstName, rewardPhrase } from "@/lib/referral-text";

/** Butik, vennens fornavn og gaven til delingslinket /k/[slug]/ven/[kode]. */
export async function loadInvite(slug: string, code: string) {
  const business = await prisma.business.findUnique({ where: { slug }, include: { referralRule: true } });
  if (!business) return null;
  const referrer = business.referralsEnabled ? await findReferrerByCode(business.id, code).catch(() => null) : null;
  const rule = business.referralRule;
  return {
    shop: cardTitle(business),
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    friend: referrer ? firstName(referrer.name) : null,
    gift: rule ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : null,
  };
}
