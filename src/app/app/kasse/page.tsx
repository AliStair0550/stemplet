import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { Kassemodus, type KioskCard } from "./Kassemodus";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Stempel" };
export const dynamic = "force-dynamic";

export default async function KassePage() {
  const { business } = await requireBusiness();
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  const kioskCard: KioskCard = {
    businessName: business.name,
    logoUrl: business.logoUrl,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    rewardText: card?.rewardText ?? "din belønning",
    stampsRequired: card?.stampsRequired ?? 10,
  };

  return (
    <>
      <PageHeading
        title="Stempel"
        subtitle="Vis stempel-QR til kunden, eller scan kundens kort."
      />
      <Kassemodus card={kioskCard} />
    </>
  );
}
