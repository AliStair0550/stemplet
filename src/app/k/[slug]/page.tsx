import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StampCard } from "@/components/StampCard";
import { SubmitButton } from "@/components/SubmitButton";
import { APP_URL } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";
import { claimCard } from "./actions";
import { ShareLinkButton } from "@/components/ShareLinkButton";

// ISR: siden er ens for alle (butikkens branding + "Hent mit stempelkort"), saa
// den caches pr. butik. Foer var den dynamisk pr. request, saa kundens FOERSTE
// scan kunne ramme en cold start (~2 sek.). Nu serveres den fra cache. Om en
// kunde allerede har et kort, haandteres i claimCard ved klik (redirect til kortet).
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
  const title = business ? `Stempelkort hos ${business.name}` : "Stempelkort";
  const description = business
    ? `Hent dit digitale stempelkort hos ${business.name} direkte i Apple Wallet. Ingen app. Ingen tilmelding.`
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
  if (!business || business.cards.length === 0) notFound();
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
            Dit stempelkort hos {business.name}
          </h1>
          <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
            {card.rewardText}. Ingen app. Ingen tilmelding.
          </p>
        </div>

        <StampCard
          businessName={business.name}
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
          <form action={claimCard.bind(null, slug)}>
            <SubmitButton
              variant="primary"
              size="lg"
              pendingText="Opretter dit kort..."
            >
              Hent mit stempelkort
            </SubmitButton>
          </form>
          <Link
            href="/find-kort"
            className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
          >
            Har du allerede et kort? Find det her.
          </Link>
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

        {/* Inspirerende deling: laeg linket videre, saa venner ogsaa faar kortet.
            Deles linket, viser previewet butikkens stempelkort (OG-billede). */}
        <div className="flex flex-col items-center gap-2 border-t border-fog pt-6">
          <p className="text-center text-[0.8rem] font-[300] leading-relaxed text-stone">
            Kender du nogen, der elsker {business.name}? Del kortet med dem.
          </p>
          <ShareLinkButton
            businessName={business.name}
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
