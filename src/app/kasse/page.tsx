import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { kasseAccess } from "@/lib/kasse";
import { Kassemodus, type KioskCard } from "@/app/app/kasse/Kassemodus";
import type { StampIconKey } from "@/lib/brand";
import { PairDevice } from "./PairDevice";
import { UnpairButton } from "./UnpairButton";
import { InstallHomeScreen } from "./InstallHomeScreen";
import { ReferralDesk } from "@/components/referral/ReferralDesk";

export const metadata: Metadata = {
  title: "Kasse",
  robots: { index: false },
  // Kassen har sit eget manifest, saa hjemmeskaerm-ikonet aabner direkte her.
  manifest: "/kasse-manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kasse", statusBarStyle: "default" },
  icons: { apple: "/app-apple-touch-icon.png" },
};
export const dynamic = "force-dynamic";

const PAIR_ERRORS: Record<string, string> = {
  ugyldig: "Koden er ugyldig, brugt eller udløbet. Bed ejeren om en ny.",
  optaget: "For mange forsøg. Prøv igen om lidt.",
};

export default async function KasseRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; fejl?: string }>;
}) {
  const { kode, fejl } = await searchParams;
  const access = await kasseAccess(false);

  if (!access) {
    return (
      <PairDevice
        presetCode={typeof kode === "string" ? kode : ""}
        error={typeof fejl === "string" ? (PAIR_ERRORS[fejl] ?? null) : null}
      />
    );
  }

  // Uden billederne (op til ca. 2 MB): kassen viser dem ikke.
  const business = await prisma.business.findUnique({
    where: { id: access.businessId },
    omit: { logoUrl: true, cardArtwork: true, cardArt: true, posterPhoto: true, businessCardDesign: true },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business) {
    return <PairDevice presetCode={typeof kode === "string" ? kode : ""} error={null} />;
  }
  const card = business.cards[0];
  // Een kasse: med Stemplet viser kunden ved scan ogsaa henvisningens foerste
  // besoeg og beloenninger. Kun Henvisninger: soeg/scan-visningen.
  const onlyReferrals = business.referralsEnabled && !business.stampsEnabled;
  const kioskCard: KioskCard = {
    businessName: business.name,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    rewardText: card?.rewardText ?? "din belønning",
    stampsRequired: card?.stampsRequired ?? 10,
  };

  return (
    <main className="dash-theme min-h-screen bg-parchment">
      <header className="flex items-center justify-between border-b border-fog px-6 py-4">
        <span className="font-[400] text-[1.05rem] tracking-[0.02em] text-ink">
          {business.name}
          <span className="ml-2 text-[0.7rem] font-[300] uppercase tracking-[0.12em] text-slate">
            Kasse
          </span>
        </span>
        <div className="flex items-center gap-5">
          <InstallHomeScreen />
          {access.source === "device" ? <UnpairButton /> : null}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        {onlyReferrals ? (
          <ReferralDesk hasPin={business.staffPin != null} />
        ) : (
          <Kassemodus
            card={kioskCard}
            selfScan={business.selfScanEnabled}
            hasPin={business.staffPin != null}
            referrals={business.referralsEnabled}
          />
        )}
      </div>
    </main>
  );
}
