import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { offerIsLive } from "@/lib/member-offers";
import { KommunikationTabs } from "../beskeder/KommunikationTabs";
import { OffersSection, type OfferRow } from "./OffersManager";

export const metadata: Metadata = { title: "Tilbud" };
export const dynamic = "force-dynamic";

// Tilbud og samarbejdspartnere til kortholderne. Vises paa kundens side
// "Tilbud og fordele" (knappen under kortet i Wallet).
export default async function TilbudPage() {
  const { business } = await requireBusiness();
  const rows = await prisma.memberOffer.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } });
  const now = new Date();
  const toRow = (o: (typeof rows)[number]): OfferRow => ({
    id: o.id,
    title: o.title,
    text: o.text,
    partnerName: o.partnerName,
    link: o.link,
    endsAt: o.endsAt?.toISOString() ?? null,
    active: o.active,
    live: offerIsLive(o, now),
  });

  return (
    <>
      <KommunikationTabs active="tilbud" showCampaigns={business.stampsEnabled} />
      <PageHeading
        title="Tilbud"
        subtitle="Særlige tilbud og rabatter hos samarbejdspartnere. Kunderne ser dem under Tilbud og fordele, når de trykker på knappen under kortet i Wallet."
      />
      <div className="flex flex-col gap-6">
        <OffersSection kind="OFFER" offers={rows.filter((o) => o.kind === "OFFER").map(toRow)} />
        <OffersSection kind="PARTNER" offers={rows.filter((o) => o.kind === "PARTNER").map(toRow)} />
      </div>
    </>
  );
}
