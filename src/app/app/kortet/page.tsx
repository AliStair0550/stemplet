import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import type { CardDesign } from "@/components/CardDesigner";
import type { StampIconKey } from "@/lib/brand";
import { effectiveStyle, isCardHeader, normalizeActions, type CardLookContext } from "@/lib/card-look";
import { rewardPhrase } from "@/lib/referral-text";
import { isCardArt } from "@/lib/card-art";
import { KortetEditor } from "./KortetEditor";

export const metadata: Metadata = { title: "Design" };
export const dynamic = "force-dynamic";

// Design: det faelles kortdesign for alle funktioner paa kortet. Hvad kortet
// kan (stempler, henvisninger og deres regler), ligger under Regler.
export default async function KortetPage() {
  const { business } = await requireBusiness();
  const [card, rule] = await Promise.all([
    prisma.card.findFirst({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } }),
    business.referralsEnabled ? prisma.referralRule.findUnique({ where: { businessId: business.id } }) : null,
  ]);

  const ctx: CardLookContext = {
    stampsEnabled: business.stampsEnabled,
    referralsEnabled: business.referralsEnabled,
    bookingUrl: business.bookingUrl,
  };
  const initial: CardDesign = {
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "Din belønning",
    stampIcon: (card?.stampIcon as StampIconKey) ?? "coffee",
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
    logoScale: business.logoScale,
    cardHeader: isCardHeader(business.cardHeader) ? business.cardHeader : "logo",
    terms: card?.terms ?? null,
    displayName: business.displayName,
  };
  // Kun de knapper, der rent faktisk er paa kortet (ingen valgt = ingen knapper).
  const actions = normalizeActions(business.cardActions, ctx);

  return (
    <>
      <PageHeading
        title="Design"
        subtitle="Sådan ser dit kort ud i kundernes Apple Wallet. Hvad kortet kan, vælger du under Regler."
      />
      <KortetEditor
        initial={initial}
        initialStyle={effectiveStyle(business.cardStyle, ctx, !!business.cardArtwork)}
        initialArtwork={business.cardArtwork}
        initialArt={isCardArt(business.cardArt) ? business.cardArt : "aurora"}
        initialAccent={business.cardAccent}
        initialActions={actions}
        ctx={ctx}
        businessName={business.name}
        friendReward={rule ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : "100 kr."}
        referrerReward={rule ? rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue) : "gratis klip"}
        shared={!!business.sharedAt || !!business.posterMadeAt}
      />
    </>
  );
}
