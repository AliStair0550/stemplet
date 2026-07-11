import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { WALLET_ENABLED } from "./env";

// Data til personale-guiden. Butiksspecifikke vaerdier hentes LIVE herfra, saa
// guiden altid afspejler butikkens faktiske indstillinger.

export type GuideCampaign = {
  type: "DOUBLE_STAMP" | "WELCOME_BONUS";
  endsAt: Date;
};

export type GuideData = {
  businessName: string;
  slug: string;
  stampsRequired: number;
  rewardText: string;
  cooldownMin: number;
  walletEnabled: boolean;
  campaigns: GuideCampaign[];
};

export async function loadGuideData(
  where: Prisma.BusinessWhereUniqueInput,
  now: Date = new Date(),
): Promise<GuideData | null> {
  const business = await prisma.business.findUnique({
    where,
    include: {
      cards: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        include: { campaigns: true },
      },
    },
  });
  if (!business || business.cards.length === 0) return null;
  const card = business.cards[0];

  const campaigns: GuideCampaign[] = card.campaigns
    .filter((c) => c.startsAt <= now && c.endsAt >= now)
    .map((c) => ({ type: c.type, endsAt: c.endsAt }));

  return {
    businessName: business.name,
    slug: business.slug,
    stampsRequired: card.stampsRequired,
    rewardText: card.rewardText,
    cooldownMin: business.stampCooldownMin,
    walletEnabled: WALLET_ENABLED,
    campaigns,
  };
}
