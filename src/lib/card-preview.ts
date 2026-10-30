import "server-only";
import type { Business } from "@prisma/client";
import { prisma } from "./prisma";
import type { StampIconKey } from "./brand";
import { cardTitle } from "./brand";
import { effectiveStyle, normalizeActions, type CardLookContext } from "./card-look";
import { rewardPhrase } from "./referral-text";
import type { WalletCardPreviewProps } from "@/components/WalletCardPreview";

/**
 * Alt, der skal til for at vise butikkens kort som i kundernes Wallet (Hjem og
 * Kortet): butikkens design, Stemplets regler og Henvisningers beloenninger.
 */
export async function loadCardPreview(business: Business): Promise<Omit<WalletCardPreviewProps, "os">> {
  const [card, rule] = await Promise.all([
    prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } }),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
  ]);
  const ctx: CardLookContext = {
    stampsEnabled: business.stampsEnabled,
    referralsEnabled: business.referralsEnabled,
    bookingUrl: business.bookingUrl,
  };
  return {
    style: effectiveStyle(business.cardStyle, ctx, !!business.cardArtwork),
    artwork: business.cardArtwork,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
    name: cardTitle(business),
    stampIcon: (card?.stampIcon as StampIconKey) ?? "coffee",
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "Din belønning",
    product: business.stampsEnabled && business.referralsEnabled ? "begge" : business.referralsEnabled ? "henvisninger" : "stemplet",
    friendReward: rule ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : "100 kr.",
    referrerReward: rule ? rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue) : "gratis klip",
    actions: normalizeActions(business.cardActions, ctx),
  };
}
