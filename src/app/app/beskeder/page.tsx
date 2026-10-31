import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { cardTitle } from "@/lib/brand";
import { NEWS_MAX, nextNewsAllowedAt } from "@/lib/news";
import { newsOptOutCount, walletCardCount } from "@/lib/news-reach";
import { KommunikationTabs } from "./KommunikationTabs";
import { NewsComposer } from "./NewsComposer";

export const metadata: Metadata = { title: "Pushbeskeder" };
export const dynamic = "force-dynamic";

export default async function BeskederPage({ searchParams }: { searchParams: Promise<{ tekst?: string }> }) {
  const { business } = await requireBusiness();
  // Udfyldt besked fra Tilbud ("Send som pushbesked"); ejeren retter og sender selv.
  const preset = ((await searchParams).tekst ?? "").slice(0, NEWS_MAX);
  const [inWallet, optedOut, history] = await Promise.all([
    walletCardCount(business.id),
    newsOptOutCount(business.id),
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
      <KommunikationTabs active="beskeder" showCampaigns={business.stampsEnabled} />
      <PageHeading
        title="Pushbeskeder"
        subtitle="Send en nyhed til kundernes låseskærm. Én om dagen."
      />
      <NewsComposer
        shopName={cardTitle(business)}
        initialText={preset}
        current={business.newsText}
        sentAt={business.newsSentAt?.toISOString() ?? null}
        nextAllowedAt={next?.toISOString() ?? null}
        inWallet={inWallet}
        optedOut={optedOut}
        history={history.map((h) => ({ id: h.id, text: h.text, recipients: h.recipients, sentAt: h.sentAt.toISOString() }))}
      />
    </>
  );
}
