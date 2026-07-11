import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { CampaignManager } from "./CampaignManager";

export const metadata: Metadata = { title: "Kampagner" };
export const dynamic = "force-dynamic";

export default async function KampagnerPage() {
  const { business } = await requireBusiness();

  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    include: { campaigns: { orderBy: { startsAt: "desc" } } },
  });

  const campaigns = (card?.campaigns ?? []).map((c) => ({
    id: c.id,
    type: c.type,
    startsAt: c.startsAt.toISOString(),
    endsAt: c.endsAt.toISOString(),
  }));

  return (
    <>
      <PageHeading
        title="Kampagner"
        subtitle="Giv ekstra stempler i en periode."
      />
      <CampaignManager campaigns={campaigns} />
    </>
  );
}
