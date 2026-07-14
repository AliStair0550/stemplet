import {
  verifyStampToken,
  readStampBusinessIdAllowExpired,
} from "@/lib/tokens";
import { prisma } from "@/lib/prisma";
import { WALLET_ENABLED } from "@/lib/env";
import { ButtonLink } from "@/components/ui";
import { StampConfirm } from "./StampConfirm";

export const dynamic = "force-dynamic";

export default async function StampPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let brand: {
    slug: string;
    name: string;
    primaryColor: string;
    textColor: string;
    logoUrl: string | null;
    stampIcon: string;
    rewardText: string;
  } | null = null;
  try {
    const payload = await verifyStampToken(token);
    const business = await prisma.business.findUnique({
      where: { id: payload.businessId },
      select: {
        slug: true,
        name: true,
        primaryColor: true,
        textColor: true,
        logoUrl: true,
        cards: {
          where: { active: true },
          take: 1,
          select: { stampIcon: true, rewardText: true },
        },
      },
    });
    if (business) {
      brand = {
        slug: business.slug,
        name: business.name,
        primaryColor: business.primaryColor,
        textColor: business.textColor,
        logoUrl: business.logoUrl,
        stampIcon: business.cards[0]?.stampIcon ?? "coffee",
        rewardText: business.cards[0]?.rewardText ?? "din belønning",
      };
    }
  } catch {
    brand = null;
  }

  if (!brand) {
    // Udløbet (men aegte) skærm-QR: udled butikken af den stadig-signerede
    // token, saa en kunde der allerede har et kort kan komme direkte til det i
    // stedet for at strande. Kan vi ikke udlede en butik, er token forfalsket
    // eller vrøvl, og vi viser blot den neutrale besked.
    let recoverSlug: string | null = null;
    const bizId = await readStampBusinessIdAllowExpired(token);
    if (bizId) {
      const biz = await prisma.business.findUnique({
        where: { id: bizId },
        select: { slug: true },
      });
      recoverSlug = biz?.slug ?? null;
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-parchment px-6 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clay/40 text-stone">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5M12 16h.01" />
          </svg>
        </span>
        <h1 className="font-[300] text-[1.4rem] text-ink">Koden er udløbet</h1>
        <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
          Stempel-koder er kun gyldige et minut ad gangen. Bed personalet om at
          vise en ny, eller åbn dit eget kort.
        </p>
        {recoverSlug ? (
          <ButtonLink href={`/k/${recoverSlug}`} variant="primary" size="lg">
            Åbn mit kort
          </ButtonLink>
        ) : null}
      </main>
    );
  }

  return (
    <StampConfirm
      token={token}
      slug={brand.slug}
      businessName={brand.name}
      primaryColor={brand.primaryColor}
      textColor={brand.textColor}
      logoUrl={brand.logoUrl}
      stampIcon={brand.stampIcon}
      rewardText={brand.rewardText}
      walletEnabled={WALLET_ENABLED}
    />
  );
}
