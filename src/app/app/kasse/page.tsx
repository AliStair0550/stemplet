import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { Kassemodus, type KioskCard } from "./Kassemodus";
import type { StampIconKey } from "@/lib/brand";
import { ReferralDesk } from "@/components/referral/ReferralDesk";
import {
  KasseViewSwitch,
  kasseViewFrom,
} from "@/components/referral/KasseViewSwitch";

export const metadata: Metadata = { title: "Stempel" };
export const dynamic = "force-dynamic";

export default async function KassePage({
  searchParams,
}: {
  searchParams: Promise<{ visning?: string }>;
}) {
  const { business } = await requireBusiness();
  // Henvisninger (kun naar modulet er slaaet til): skift oeverst + egen visning.
  // Uden modulet er siden uaendret.
  const view = kasseViewFrom(business.referralsEnabled, (await searchParams).visning);
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
        title={view === "henvisninger" ? "Henvisninger" : "Stempel"}
        subtitle={
          view === "henvisninger"
            ? "Søg eller scan kunden. Registrér første besøg eller indløs en belønning."
            : business.selfScanEnabled
              ? "Scan kundens kort, vis stempel-QR eller åbn kassemodus på en skærm ved disken."
              : "Scan kundens kort for at give stempler eller indløse en belønning."
        }
      />
      {business.referralsEnabled ? (
        <KasseViewSwitch basePath="/app/kasse" view={view} />
      ) : null}
      {view === "henvisninger" ? (
        <ReferralDesk hasPin={business.staffPin != null} />
      ) : (
        <Kassemodus
          card={kioskCard}
          selfScan={business.selfScanEnabled}
          hasPin={business.staffPin != null}
        />
      )}
    </>
  );
}
