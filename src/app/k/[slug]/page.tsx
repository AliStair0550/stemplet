import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCardToken } from "@/lib/cookies";
import { loadCardByToken } from "@/lib/stamp";
import { StampCard } from "@/components/StampCard";
import { SubmitButton } from "@/components/SubmitButton";
import { ButtonLink } from "@/components/ui";
import { WALLET_ENABLED } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";
import { claimCard } from "./actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await prisma.business.findUnique({ where: { slug } });
  return {
    title: business ? `Stempelkort hos ${business.name}` : "Stempelkort",
    robots: { index: false },
  };
}

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ fejl?: string }>;
}) {
  const { slug } = await params;
  const { fejl } = await searchParams;

  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business || business.cards.length === 0) notFound();
  const card = business.cards[0];

  const existingToken = await getCardToken(business.id);
  const existing = existingToken ? await loadCardByToken(existingToken) : null;
  const hasCard = existing && existing.cardId === card.id;
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
          stamps={hasCard ? existing!.stamps : 0}
          required={card.stampsRequired}
          rewardText={card.rewardText}
          showPoweredBy={showPoweredBy}
          serial={hasCard ? existing!.serial : undefined}
        />

        {fejl === "fuld" ? (
          <p className="text-center text-[0.82rem] font-[200] text-stone">
            Butikken tager ikke imod nye stempelkort lige nu. Spørg personalet,
            de kan hurtigt åbne for flere.
          </p>
        ) : null}

        {hasCard ? (
          <div className="flex flex-col items-center gap-3">
            <ButtonLink href={`/kort/${existing!.serial}`} variant="moss" size="lg">
              Åbn dit kort
            </ButtonLink>
            <p className="text-[0.75rem] font-[200] text-slate">
              Du har allerede et kort hos {business.name}.
            </p>
          </div>
        ) : (
          <form action={claimCard.bind(null, slug)}>
            <SubmitButton variant="moss" size="lg" pendingText="Opretter dit kort...">
              {WALLET_ENABLED ? "Læg i Apple Wallet" : "Hent dit stempelkort"}
            </SubmitButton>
          </form>
        )}

        {showPoweredBy ? (
          <p className="text-[0.65rem] font-[300] tracking-[0.08em] text-slate">
            Drevet af Stemplet
          </p>
        ) : null}
      </div>
    </main>
  );
}
