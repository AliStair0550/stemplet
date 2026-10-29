import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { cardTitle } from "@/lib/brand";
import { nextNewsAllowedAt } from "@/lib/news";
import { walletCardCount } from "@/lib/news-reach";
import { KunderTabs } from "../kunder/KunderTabs";
import { NewsComposer } from "./NewsComposer";

export const metadata: Metadata = { title: "Pushbeskeder" };
export const dynamic = "force-dynamic";

export default async function BeskederPage() {
  const { business } = await requireBusiness();
  const [inWallet, cardholders, history] = await Promise.all([
    walletCardCount(business.id),
    prisma.customerCard.count({ where: { card: { businessId: business.id } } }),
    prisma.newsMessage.findMany({
      where: { businessId: business.id },
      orderBy: { sentAt: "desc" },
      take: 10,
      select: { id: true, text: true, recipients: true, sentAt: true },
    }),
  ]);
  const next = nextNewsAllowedAt(business.newsSentAt);

  return (
    <>
      <KunderTabs active="beskeder" showCampaigns={business.stampsEnabled} />
      <PageHeading
        title="Pushbeskeder"
        subtitle="Send en kort nyhed direkte til dine kunders iPhone. Den vises på låseskærmen, ligesom en besked fra en app, og står på kortet bagefter."
      />
      <NewsComposer
        shopName={cardTitle(business)}
        current={business.newsText}
        sentAt={business.newsSentAt?.toISOString() ?? null}
        nextAllowedAt={next?.toISOString() ?? null}
        inWallet={inWallet}
        cardholders={cardholders}
        history={history.map((h) => ({ id: h.id, text: h.text, recipients: h.recipients, sentAt: h.sentAt.toISOString() }))}
      />
    </>
  );
}
