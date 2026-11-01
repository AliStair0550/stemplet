import type { Metadata } from "next";
import { businessImages, requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { optimizedLogoDataUri } from "@/lib/logo";
import { PageHeading } from "@/components/dash";
import { Kassemodus, type KioskCard } from "./Kassemodus";
import type { StampIconKey } from "@/lib/brand";
import { ReferralDesk } from "@/components/referral/ReferralDesk";

export const metadata: Metadata = { title: "Scan" };
export const dynamic = "force-dynamic";

export default async function KassePage({
  searchParams,
}: {
  searchParams: Promise<{ kort?: string }>;
}) {
  const { business } = await requireBusiness();
  // Een kasse: med Stemplet viser kunden ved scan baade stempler og (hvis slaaet
  // til) henvisningens foerste besoeg og beloenninger. Kun Henvisninger: soeg/scan.
  const kort = (await searchParams).kort?.trim().slice(0, 40) || null;
  const onlyReferrals = business.referralsEnabled && !business.stampsEnabled;
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  const kioskCard: KioskCard = {
    businessName: business.name,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    rewardText: card?.rewardText ?? "din belønning",
    stampsRequired: card?.stampsRequired ?? 10,
    // Kun et lille webp-logo til kortet efter scan, ikke det fulde billede.
    logoSrc: await optimizedLogoDataUri((await businessImages(business.id)).logoUrl, 160),
  };

  return (
    <div className="group/kasse">
      {/* Paa mobil forsvinder overskriften, naar et kort er scannet, saa
          stempel- og belønningsknapperne kan ses uden at rulle. */}
      <div className="max-md:group-has-[[data-kasse-kort]]/kasse:hidden">
      <PageHeading
        title="Scan"
        subtitle={
          onlyReferrals
            ? "Søg eller scan kunden. Registrér første besøg eller indløs en belønning."
            : business.selfScanEnabled
              ? "Scan kundens kort, vis stempel-QR eller åbn kassemodus på en skærm ved disken."
              : "Scan kundens kort. Du ser med det samme, om kunden skal have stempler, rabat eller en belønning."
        }
      />
      </div>
      {onlyReferrals ? (
        <ReferralDesk hasPin={business.staffPin != null} initialSerial={kort} />
      ) : (
        <Kassemodus
          card={kioskCard}
          selfScan={business.selfScanEnabled}
          hasPin={business.staffPin != null}
          referrals={business.referralsEnabled}
          initialSerial={kort}
        />
      )}
    </div>
  );
}
