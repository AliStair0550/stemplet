import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBusinessStats } from "@/lib/stats";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { cardTitle } from "@/lib/brand";
import { PLAN_LIMITS } from "@/lib/plans";
import { GettingStarted } from "../GettingStarted";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Opsætning" };
export const dynamic = "force-dynamic";

export default async function KomIGangPage() {
  const { business } = await requireBusiness();
  const [card, stats, deviceCount] = await Promise.all([
    prisma.card.findFirst({
      where: { businessId: business.id },
      orderBy: { createdAt: "asc" },
    }),
    getBusinessStats(business.id),
    prisma.device.count({
      where: { businessId: business.id, revokedAt: null },
    }),
  ]);

  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const showPoweredBy = PLAN_LIMITS[business.plan].showPoweredBy;

  return (
    <>
      <PageHeading
        title="Opsætning"
        subtitle="Her gør du butikken klar: print og del QR-koden, tilføj personale, og giv det første stempel."
      />
      <GettingStarted
        businessName={cardTitle(business)}
        cardUrl={cardUrl}
        primaryColor={business.primaryColor}
        textColor={business.textColor}
        logoUrl={business.logoUrl}
        logoScale={business.logoScale}
        stampIcon={(card?.stampIcon as StampIconKey) ?? "coffee"}
        stampsRequired={card?.stampsRequired ?? 10}
        rewardText={card?.rewardText ?? "10. kop er gratis"}
        showPoweredBy={showPoweredBy}
        serialLabel={business.name}
        deviceCount={deviceCount}
        totalCustomers={stats.totalCustomers}
        stampsTotal={stats.stampsTotal}
      />
    </>
  );
}
