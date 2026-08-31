import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StampCard } from "@/components/StampCard";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import { cardTitle, shade, rgba, hexToRgb, type StampIconKey } from "@/lib/brand";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import { ClaimFlow } from "./ClaimFlow";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { optimizedLogoDataUri } from "@/lib/logo";

// Et diskret, gentaget felt af butikkens stempel-ikon som baggrunds-tekstur.
// Tegnet i tekstfarven ved lav opacitet, saa det giver liv uden at stjaele fokus.
function iconTileDataUri(markup: string, stroke: string): string {
  const t = 116;
  const g = (x: number, y: number) =>
    `<g transform='translate(${x},${y}) scale(1.5) rotate(-8)'>${markup}</g>`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${t}' viewBox='0 0 ${t} ${t}'>` +
    `<g fill='none' stroke='${stroke}' stroke-opacity='0.06' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>` +
    `${g(14, 16)}${g(72, 74)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

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
  // Lille webp-logo bages ind i den (CDN-cachede) side, saa der ikke er en ekstra
  // netvaerkshentning: konsistent, oejeblikkelig LCP paa mobil.
  const logoSrc = await optimizedLogoDataUri(business.logoUrl);
  // Ukendt butik = aegte 404. Men findes butikken uden et AKTIVT kort (sat paa
  // pause/slettet), er en plakat-scanning ikke en fejl: vis en rolig besked i
  // stedet for den generiske 404, hvis eneste udvej er B2B-forsiden.
  if (business.cards.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-16">
        <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
          {logoSrc ? (
            <Image
              src={logoSrc}
              alt={business.name}
              width={56}
              height={56}
              className="h-14 w-14 rounded-lg object-contain"
              unoptimized
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

  // Brand-drevet, levende baggrund udledt af butikkens egne farver. LYSE farver
  // (fx Sand) faar en varm, luftig behandling (mod cremet i toppen, en blOd
  // varm gloed bag kortet), i stedet for at blive moerknet til mudder. MOERKE
  // farver faar den dybe tone med spotlight. Saa foeles siden altid flot.
  const primary = business.primaryColor;
  const text = business.textColor;
  const { r, g, b } = hexToRgb(primary);
  const isLight = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
  const iconMarkup =
    STAMP_ICON_PATHS[card.stampIcon as StampIconKey] ?? STAMP_ICON_PATHS.custom;

  // Logo-stoerrelsen paa kunde-siden klampes, saa en butik der har skruet logoet
  // stort op (til Wallet-pas/kort) ikke faar et logo der dominerer /k-siden.
  const capScale = Math.min(business.logoScale, 1.35);

  let bgStyle: React.CSSProperties;
  let cardShadow: string;
  if (isLight) {
    const bgTop = shade(primary, 0.34); // cremet top
    const bgMid = primary; // selve sandfarven
    const bgBottom = shade(primary, -0.12); // en anelse dybere i bunden
    const warm = shade(primary, 0.5); // naesten-creme varm gloed
    bgStyle = {
      backgroundColor: bgBottom,
      color: text,
      backgroundImage: [
        iconTileDataUri(iconMarkup, text),
        `radial-gradient(ellipse 130% 60% at 50% 40%, ${rgba(warm, 0.6)} 0%, transparent 62%)`,
        `radial-gradient(ellipse 110% 50% at 50% 0%, rgba(255,255,255,0.5) 0%, transparent 66%)`,
        `linear-gradient(180deg, ${bgTop} 0%, ${bgMid} 48%, ${bgBottom} 100%)`,
      ].join(", "),
      backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat",
      backgroundSize: "116px 116px, 100% 100%, 100% 100%, 100% 100%",
    };
    cardShadow = `drop-shadow(0 24px 44px ${rgba(shade(primary, -0.5), 0.32)})`;
  } else {
    const bgTop = shade(primary, -0.33);
    const bgBottom = shade(primary, -0.6);
    const spotlight = shade(primary, 0.35);
    bgStyle = {
      backgroundColor: bgBottom,
      color: text,
      backgroundImage: [
        iconTileDataUri(iconMarkup, text),
        `radial-gradient(ellipse 130% 55% at 50% 42%, ${rgba(spotlight, 0.5)} 0%, transparent 60%)`,
        `radial-gradient(ellipse 100% 45% at 50% 0%, ${rgba(text, 0.1)} 0%, transparent 70%)`,
        `linear-gradient(180deg, ${bgTop} 0%, ${bgBottom} 100%)`,
      ].join(", "),
      backgroundRepeat: "repeat, no-repeat, no-repeat, no-repeat",
      backgroundSize: "116px 116px, 100% 100%, 100% 100%, 100% 100%",
    };
    cardShadow = `drop-shadow(0 26px 48px ${rgba(shade(primary, -0.72), 0.6)})`;
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
      style={bgStyle}
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          {logoSrc ? (
            // Brand-logo i vilkaarligt format: <img> beholder logoets egne
            // proportioner (ingen firkantet beskaering), stort og tydeligt i toppen.
            // Cachet URL (ikke inlinet), og eager + hoej prioritet da det er LCP.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={business.name}
              fetchPriority="high"
              className="w-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
              style={{ height: `${4 * capScale}rem`, maxWidth: "min(60vw, 14rem)" }}
            />
          ) : null}
          <div className="flex flex-col gap-2">
            <h1
              className="font-[300] text-[1.5rem] leading-tight"
              style={{ color: text }}
            >
              Dit stempelkort hos {cardTitle(business)}
            </h1>
            <p
              className="mx-auto max-w-xs font-[300] text-[0.92rem] leading-relaxed"
              style={{ color: rgba(text, 0.72) }}
            >
              {card.rewardText}. Ingen app. Ingen tilmelding.
            </p>
          </div>
        </div>

        {/* Kortet loeftes fra baggrunden med en blOd skygge, saa det svaever. */}
        <div className="w-full" style={{ filter: cardShadow }}>
          <StampCard
            businessName={cardTitle(business)}
            logoUrl={logoSrc}
            logoScale={capScale}
            priority
            primaryColor={business.primaryColor}
            textColor={business.textColor}
            stampIcon={card.stampIcon as StampIconKey}
            stamps={0}
            required={card.stampsRequired}
            rewardText={card.rewardText}
            showPoweredBy={showPoweredBy}
          />
        </div>

        <div className="flex w-full flex-col items-center gap-4">
          <ClaimFlow
            slug={slug}
            walletEnabled={WALLET_ENABLED}
            ctaBg={text}
            ctaFg={primary}
          />
          {/* Betingelser (valgfri): en diskret, foldbar raekke, saa fokus bliver
              paa kortet og knappen, men de er der for kunden. */}
          {card.terms ? (
            <details
              className="group w-full overflow-hidden rounded-2xl"
              style={{
                background: rgba(text, 0.06),
                border: `1px solid ${rgba(text, 0.16)}`,
              }}
            >
              <summary
                className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[0.66rem] font-[500] uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden"
                style={{ color: rgba(text, 0.85) }}
              >
                Betingelser
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 transition-transform duration-200 group-open:rotate-180"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </summary>
              <p
                className="px-4 pb-4 text-[0.8rem] font-[300] leading-relaxed"
                style={{ color: rgba(text, 0.7) }}
              >
                {card.terms}
              </p>
            </details>
          ) : null}
          {/* GDPR-formaal: gjort klart FOER kortet hentes, at vi gemmer
              stempelhistorik og hvorfor (belOEnninger + fordele). */}
          <p
            className="max-w-xs text-center text-[0.72rem] font-[300] leading-relaxed"
            style={{ color: rgba(text, 0.55) }}
          >
            Når du henter kortet, gemmer {business.name} din stempelhistorik, så
            du kan optjene stempler og få belønninger og fordele. Se{" "}
            <a
              href="/privatliv"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 opacity-90 transition-opacity hover:opacity-100"
              style={{ color: rgba(text, 0.7) }}
            >
              privatlivspolitikken
            </a>
            .
          </p>
        </div>

        {/* Deling: laeg linket videre, saa venner ogsaa faar kortet. Deles
            linket, viser previewet butikkens stempelkort (OG-billede). */}
        <div
          className="flex w-full flex-col items-center border-t pt-6"
          style={{ borderColor: rgba(text, 0.15) }}
        >
          <ShareLinkButton
            businessName={cardTitle(business)}
            url={`${APP_URL}/k/${slug}`}
            label="Del kortet"
            tone="onDark"
          />
        </div>

        {showPoweredBy ? (
          <p
            className="text-[0.65rem] font-[300] tracking-[0.08em]"
            style={{ color: rgba(text, 0.45) }}
          >
            Drevet af Stemplet
          </p>
        ) : null}
      </div>
    </main>
  );
}
