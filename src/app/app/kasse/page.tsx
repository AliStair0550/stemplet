import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { listDevices } from "@/lib/kasse";
import { PageHeading } from "@/components/dash";
import { Kassemodus, type KioskCard } from "./Kassemodus";
import { KasseDevices } from "./KasseDevices";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Stempel" };
export const dynamic = "force-dynamic";

export default async function KassePage() {
  const { business } = await requireBusiness();
  const [card, devices] = await Promise.all([
    prisma.card.findFirst({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
    listDevices(business.id),
  ]);

  const kioskCard: KioskCard = {
    businessName: business.name,
    logoUrl: business.logoUrl,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    rewardText: card?.rewardText ?? "din belønning",
    stampsRequired: card?.stampsRequired ?? 10,
  };

  const deviceList = devices.map((d) => ({
    id: d.id,
    name: d.name,
    lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
  }));

  return (
    <>
      <PageHeading
        title="Stempel"
        subtitle="Vis stempel-QR til kunden, scan kundens kort, eller åbn kassemodus på en skærm ved disken."
      />
      <div className="flex flex-col gap-10">
        <Kassemodus card={kioskCard} />
        <KasseDevices devices={deviceList} />
      </div>
    </>
  );
}
