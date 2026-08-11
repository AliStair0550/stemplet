import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StampCard } from "@/components/StampCard";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import { cardTitle, type StampIconKey } from "@/lib/brand";
import { ClaimFlow } from "./ClaimFlow";
import { ShareLinkButton } from "@/components/ShareLinkButton";

// ISR: siden er ens for alle (butikkens branding + "Hent mit stempelkort"), saa
// den caches pr. butik. Foer var den dynamisk pr. request, saa kundens FOERSTE
// scan kunne ramme en cold start (~2 sek.). Nu serveres den fra cache. Selve
// oprettelsen (og om kunden allerede har et kort) haandteres i claim-ruten
// /api/wallet/claim/[slug], som "Hent mit stempelkort"-linket peger paa.
export const revalidate = 3600;

// Pre-renderer de kendte butikker ved build, saa deres tilmeldings-side er ren
// statisk (CDN, ingen cold start) fra allerfoerste scan. Nye butikker rendres
// on-demand og caches derefter (ISR).
export async function generateStaticParams() {
  try {
    const shops = await prisma.business.findMany({ select: { slug: true } });
    return shops.map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug } });
  const brandName = business ? cardTitle(business) : "";
  const title = business ? `Stempelkort hos ${brandName}` : "Stempelkort";
  const description = business
    ? `Hent dit digitale stempelkort hos ${brandName} direkte i Apple Wallet. Ingen app. Ingen tilmelding.`
    : "Digitalt stempelkort i Apple Wallet.";
  return {
    title,
    description,
    // noindex: siden er personlig, men link-previews (OG) virker stadig.
    robots: { index: false },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business) notFound();
  // Ukendt butik = aegte 404. Men findes butikken uden et AKTIVT kort (sat paa
  // pause/slettet), er en plakat-scanning ikke en fejl: vis en rolig besked i
  // stedet for den generiske 404, hvis eneste udvej er B2B-forsiden.
  if (business.cards.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
            />
          ) : null}
          <h1 className="font-[300] text-[1.4rem] leading-tight text-ink">
            {cardTitle(business)}
          </h1>
          <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
            Stempelkortet er ikke aktivt lige nu. Spørg personalet i butikken, så
            hjælper de dig.
          </p>
        </div>
      </main>
    );
  }
  const card = business.cards[0];
  const showPoweredBy = PLAN_LIMITS[business.plan].showPoweredBy;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3 text-center">
          {business.logoUrl ? (
            <Image
              src={business.logoUrl}
              alt={business.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
            />
          ) : null}
          <h1 className="font-[300] text-[1.5rem] leading-tight text-ink">
            Dit stempelkort hos {cardTitle(business)}
          </h1>
          <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
            {card.rewardText}. Ingen app. Ingen tilmelding.
          </p>
        </div>

        <StampCard
          businessName={cardTitle(business)}
          logoUrl={business.logoUrl}
          primaryColor={business.primaryColor}
          textColor={business.textColor}
          stampIcon={card.stampIcon as StampIconKey}
          stamps={0}
          required={card.stampsRequired}
          rewardText={card.rewardText}
          showPoweredBy={showPoweredBy}
        />

        <div className="flex flex-col items-center gap-4">
          <ClaimFlow slug={slug} walletEnabled={WALLET_ENABLED} />
          {/* Betingelser (valgfri): diskret under "Hent mit stempelkort", saa
              fokus bliver paa kortet og knappen, men de er der for kunden. */}
          {card.terms ? (
            <div className="w-full rounded-lg border border-fog bg-sand/60 px-4 py-3 text-center">
              <p className="text-[0.6rem] font-[500] uppercase tracking-[0.14em] text-slate">
                Betingelser
              </p>
              <p className="mt-1 text-[0.78rem] font-[300] leading-relaxed text-stone">
                {card.terms}
              </p>
            </div>
          ) : null}
          {/* GDPR-formaal: gjort klart FOER kortet hentes, at vi gemmer
              stempelhistorik og hvorfor (belOEnninger + fordele). */}
          <p className="max-w-xs text-center text-[0.7rem] font-[300] leading-relaxed text-slate">
            Når du henter kortet, gemmer {business.name} din stempelhistorik, så
            du kan optjene stempler og få belønninger og fordele. Se{" "}
            <a
              href="/privatliv"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-ink"
            >
              privatlivspolitikken
            </a>
            .
          </p>
        </div>

        {/* Deling: laeg linket videre, saa venner ogsaa faar kortet. Deles
            linket, viser previewet butikkens stempelkort (OG-billede). */}
        <div className="flex flex-col items-center border-t border-fog pt-6">
          <ShareLinkButton
            businessName={cardTitle(business)}
            url={`${APP_URL}/k/${slug}`}
            label="Del kortet"
          />
        </div>

        {showPoweredBy ? (
          <p className="text-[0.65rem] font-[300] tracking-[0.08em] text-slate">
            Drevet af Stemplet
          </p>
        ) : null}
      </div>
    </main>
  );
}
