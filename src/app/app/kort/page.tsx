import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
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

  return (
    <>
      <PageHeading
        title="Dit kort"
        subtitle="Design kortet. Ændringer gælder med det samme på nye stempler."
      />
      <KortEditor
        initial={initial}
        businessName={business.name}
        showPoweredBy={false}
      />
    </>
  );
}
