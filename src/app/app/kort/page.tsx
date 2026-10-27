import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireStampsBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { KortEditor } from "./KortEditor";
import type { StampIconKey } from "@/lib/brand";
import type { CardDesign } from "@/components/CardDesigner";

export const metadata: Metadata = { title: "Design" };
export const dynamic = "force-dynamic";

export default async function KortPage() {
  const { business } = await requireStampsBusiness();
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  const initial: CardDesign = {
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "10. kop er gratis",
    stampIcon: (card?.stampIcon as StampIconKey) ?? "coffee",
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
    logoScale: business.logoScale,
    terms: card?.terms ?? null,
    displayName: business.displayName,
  };

  const qrDataUrl = await QRCode.toDataURL(`${APP_URL}/k/${business.slug}`, {
    margin: 1,
    width: 320,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return (
    <>
      <PageHeading
        title="Design"
        subtitle="Sådan ser dit stempelkort ud for kunderne. Tryk Gem, når du er færdig."
      />
      <KortEditor
        initial={initial}
        businessName={business.name}
        slug={business.slug}
        qrDataUrl={qrDataUrl}
      />
    </>
  );
}
