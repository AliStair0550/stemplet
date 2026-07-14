import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { kasseAccess } from "@/lib/kasse";
import { Kassemodus, type KioskCard } from "@/app/app/kasse/Kassemodus";
import type { StampIconKey } from "@/lib/brand";
import { PairDevice } from "./PairDevice";
import { unpairAction } from "./actions";

export const metadata: Metadata = {
  title: "Kasse",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function KasseRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string }>;
}) {
  const { kode } = await searchParams;
  const access = await kasseAccess(false);

  if (!access) {
    return <PairDevice presetCode={typeof kode === "string" ? kode : ""} />;
  }

  const business = await prisma.business.findUnique({
    where: { id: access.businessId },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business) {
    return <PairDevice presetCode={typeof kode === "string" ? kode : ""} />;
  }
  const card = business.cards[0];
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
    <main className="min-h-screen bg-parchment">
      <header className="flex items-center justify-between border-b border-fog px-6 py-4">
        <span className="font-[400] text-[1.05rem] tracking-[0.02em] text-ink">
          {business.name}
          <span className="ml-2 text-[0.7rem] font-[300] uppercase tracking-[0.12em] text-slate">
            Kasse
          </span>
        </span>
        {access.source === "device" ? (
          <form action={unpairAction}>
            <button className="text-[0.68rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-rust">
              Frakobl enhed
            </button>
          </form>
        ) : null}
      </header>
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <Kassemodus card={kioskCard} selfScan={business.selfScanEnabled} />
      </div>
    </main>
  );
}
