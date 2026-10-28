import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { cardTitle } from "@/lib/brand";
import { nextNewsAllowedAt } from "@/lib/news";
import { KunderTabs } from "../kunder/KunderTabs";
import { NewsComposer } from "./NewsComposer";

export const metadata: Metadata = { title: "Beskeder" };
export const dynamic = "force-dynamic";

export default async function BeskederPage() {
  const { business } = await requireBusiness();
  // Hvor mange kort i Wallet faar beskeden (kort med mindst een registrering).
  const [inWallet, cardholders] = await Promise.all([
    prisma.walletRegistration
      .findMany({
        where: { customerCard: { card: { businessId: business.id } } },
        select: { customerCardId: true },
        distinct: ["customerCardId"],
      })
      .then((r) => r.length),
    prisma.customerCard.count({ where: { card: { businessId: business.id } } }),
  ]);
  const next = nextNewsAllowedAt(business.newsSentAt);

  return (
    <>
      <KunderTabs active="beskeder" showCampaigns={business.stampsEnabled} />
      <PageHeading
        title="Beskeder"
        subtitle="Skriv en kort nyhed til dine kunder. Den lægges på deres kort og vises på låseskærmen, ligesom en besked fra en app."
      />
      <NewsComposer
        shopName={cardTitle(business)}
        current={business.newsText}
        sentAt={business.newsSentAt?.toISOString() ?? null}
        nextAllowedAt={next?.toISOString() ?? null}
        inWallet={inWallet}
        cardholders={cardholders}
      />
    </>
  );
}
