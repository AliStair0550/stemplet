import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { cardTitle, type StampIconKey } from "@/lib/brand";
import { defaultDesign, mergeDesign } from "@/lib/visitkort";
import { VisitkortDesigner } from "./VisitkortDesigner";

export const metadata: Metadata = { title: "Visitkort" };
export const dynamic = "force-dynamic";

export default async function VisitkortPage() {
  const { business } = await requireBusiness();
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qr = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#111111", light: "#FFFFFF" },
  });

  const base = defaultDesign({
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    slug: business.slug,
    stampsEnabled: business.stampsEnabled,
  });
  const merged = mergeDesign(base, business.businessCardDesign);
  // Uden stempler giver stempelkort-bagsiden ingen mening: vis QR-bagsiden.
  const design = business.stampsEnabled ? merged : { ...merged, backContent: "qr" as const };

  return (
    <>
      <PageHeading
        title="Visitkort"
        subtitle="For- og bagside med QR-kode. Hent som tryk-klar PDF."
      />
      <VisitkortDesigner
        initial={design}
        brand={{ primary: business.primaryColor, text: business.textColor }}
        businessName={cardTitle(business)}
        logoUrl={business.logoUrl}
        qrDataUrl={qr}
        stampsRequired={card?.stampsRequired ?? 10}
        rewardText={card?.rewardText ?? "10. på huset"}
        stampIcon={(card?.stampIcon as StampIconKey) ?? "coffee"}
        stampsEnabled={business.stampsEnabled}
      />
    </>
  );
}
