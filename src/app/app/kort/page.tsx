import type { Metadata } from "next";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { KortEditor } from "./KortEditor";
import type { StampIconKey } from "@/lib/brand";
import type { CardDesign } from "@/components/CardDesigner";

export const metadata: Metadata = { title: "Kort" };
export const dynamic = "force-dynamic";

export default async function KortPage() {
  const { business } = await requireBusiness();
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
  };

  const qrDataUrl = await QRCode.toDataURL(`${APP_URL}/k/${business.slug}`, {
    margin: 1,
    width: 320,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return (
    <>
      <PageHeading
        title="Dit kort"
        subtitle="Design dit unikke stempelkort, download det og fortæl dine kunder om det."
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
