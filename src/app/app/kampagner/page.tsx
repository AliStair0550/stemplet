import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { CampaignManager } from "./CampaignManager";
import { ShareCardSection } from "./ShareCardSection";
import type { CardDesign } from "@/components/CardDesigner";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Kampagner" };
export const dynamic = "force-dynamic";

export default async function KampagnerPage() {
  const { business } = await requireBusiness();

  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    include: { campaigns: { orderBy: { startsAt: "desc" } } },
  });

  const campaigns = (card?.campaigns ?? []).map((c) => ({
    id: c.id,
    type: c.type,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
  }));

  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qr = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
  const design: CardDesign = {
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "din belønning",
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
  };

  return (
    <>
      <PageHeading
        title="Kampagner"
        subtitle="Del dit kort og giv ekstra stempler i en periode."
      />
      <ShareCardSection
        design={design}
        businessName={business.name}
        slug={business.slug}
        cardUrl={cardUrl}
        qrDataUrl={qr}
      />
      <div className="mt-8">
        <CampaignManager campaigns={campaigns} />
      </div>
    </>
  );
}
