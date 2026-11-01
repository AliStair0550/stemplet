import type { NextRequest } from "next/server";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { getSessionBusinessId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { buildStripImages } from "@/lib/wallet/strip";
import { isStampIcon, contrastRatio, contrastText, isCardReadable, normalizeHex, photoPalette } from "@/lib/brand";
import { effectiveStyle } from "@/lib/card-look";
import { headlineFromParam, focusFromParam, posterFootline, posterRewardLine } from "@/lib/materials";
import { cardShortName, claimCta } from "@/lib/card-name";
import { rewardPhrase } from "@/lib/referral-text";
import { MaterialsPdf, type MaterialTier } from "./Doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Indlejr brand-fonten Instrument Sans i PDF'erne. Registreres her (samme
// react-pdf-instans som renderToBuffer), saa den altid er tilgaengelig ved
// render. TTF'erne bundles ind i serverless via outputFileTracingIncludes.
Font.register({
  family: "Instrument Sans",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/InstrumentSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "src/fonts/InstrumentSans-Bold.ttf"), fontWeight: 700 },
  ],
});
// Ingen hyphenering af danske ord midt over.
Font.registerHyphenationCallback((word) => [word]);

type PageSize = "A4" | "A5" | "A6" | "A7" | [number, number];

// Visitkort: A7 i landskab (105x74 mm), et lille kort. En custom tuple-stoerrelse
// fik react-pdf til at haenge paa serveren, saa vi bruger en navngivet stoerrelse.
const FORMATS: Record<
  string,
  { pageSize: PageSize; tier: MaterialTier; file: string }
> = {
  plakat: { pageSize: "A4", tier: "lg", file: "plakat-a4" },
  a5: { pageSize: "A5", tier: "md", file: "skilt-a5" },
  skilt: { pageSize: "A6", tier: "sm", file: "diskskilt-a6" },
  visitkort: { pageSize: "A7", tier: "xs", file: "visitkort" },
};

// Afslut en saetning med punktum, men ikke to ("100 kr." + ".").

const withCard = {
  cards: { take: 1, orderBy: { createdAt: "asc" as const } },
  referralRule: true,
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const fmt = FORMATS[type] ?? FORMATS.plakat;

  // PDF-generering er tung: bremse pr. enhed, saa endpointet ikke kan hamres
  // som en DoS-vektor. Rigeligt til en ejer, der henter alle stoerrelser.
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("materials", ip, 40, 300))) {
    return new Response("For mange forespørgsler. Prøv igen om lidt.", {
      status: 429,
    });
  }

  // Offentlig adgang via ?slug= (bruges i onboarding, foer brugeren har
  // et login). Uden slug kraeves en session (dashboardets materialer-side).
  // Alt paa skiltet (navn, logo, beloenning, QR til /k/slug) er i forvejen
  // offentligt via det offentlige kort, saa slug-adgang laekker intet.
  const slug = req.nextUrl.searchParams.get("slug")?.trim();

  let business = null;
  if (slug) {
    business = await prisma.business.findUnique({
      where: { slug },
      include: withCard,
    });
  } else {
    const businessId = await getSessionBusinessId();
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        include: withCard,
      });
    }
  }

  if (!business) {
    return new Response("Ikke fundet.", { status: slug ? 404 : 401 });
  }

  const sp = req.nextUrl.searchParams;
  // Fokus: hent kortet (QR til /k) eller henvis en ven (QR til henvisningssiden).
  const focus = focusFromParam(sp.get("fokus"), business);
  // Een butiksside: QR til /k; "henvis"-plakaten aabner den med henvisningen fremme.
  const cardUrl = focus === "henvis" ? `${APP_URL}/k/${business.slug}?del=1` : `${APP_URL}/k/${business.slug}`;
  const card = business.cards[0];
  const rule = business.referralRule;
  const required = card?.stampsRequired ?? 10;
  const stampIcon =
    card && isStampIcon(card.stampIcon) ? card.stampIcon : "coffee";

  // Valgmuligheder (query): navn/logo, baggrund, overskrift, stempel-gitter.
  const showBrand = sp.get("navn") === "1";
  const light = sp.get("bg") === "lys";
  // Eget billede fra Design som baggrund (kun naar butikken har et).
  // Plakatens eget billede, ellers billedet fra Design.
  const ownPhoto = business.posterPhoto ?? business.cardArtwork;
  const photoSrc = sp.get("bg") === "billede" && ownPhoto ? ownPhoto : null;

  // "Kortets farve" = de farver, kortet faktisk har i Wallet: med eget billede
  // bytter Wallet rollerne (lys tekst paa moerk bund), og en ulaeselig
  // tekstfarve erstattes af sort/hvid. Ellers matcher plakaten ikke kortet.
  const style = effectiveStyle(business.cardStyle, { stampsEnabled: business.stampsEnabled, referralsEnabled: business.referralsEnabled, bookingUrl: business.bookingUrl }, !!business.cardArtwork);
  const palette = style === "photo" ? photoPalette(business.primaryColor, business.textColor) : { primaryColor: business.primaryColor, textColor: business.textColor };
  const cardBg = normalizeHex(palette.primaryColor);
  const cardFg = isCardReadable(cardBg, palette.textColor) ? palette.textColor : contrastText(cardBg);
  const showGridOpt = sp.get("stempler") !== "0" && focus === "kort" && business.stampsEnabled;
  const fallbackHeadline =
    focus === "henvis" ? "Henvis en ven" : claimCta(cardShortName(business));
  const headline = sp.get("titel")?.trim() ? headlineFromParam(sp.get("titel")) : fallbackHeadline;
  const referralOn = business.referralsEnabled && rule;
  const rewardLine = posterRewardLine(focus, {
    // "Gratis klip efter 10 stempler": uden antallet ved kunden ikke, hvad det betyder.
    stampReward: business.stampsEnabled && card ? `${card.rewardText} efter ${required} stempler` : null,
    friendReward: referralOn ? rewardPhrase(rule.newCustomerRewardType, rule.newCustomerRewardValue) : null,
    referrerReward: referralOn ? rewardPhrase(rule.referrerRewardType, rule.referrerRewardValue) : null,
  });

  // Oploeste side-farver. Farvet: kortets egne farver. Lys: blaeksparende
  // parchment med en laesbar moerk tekst (kortets farve hvis den staar klart paa
  // lys, ellers en neutral moerk). Gitteret tegnes i samme laesbare farve.
  const LIGHT_BG = "#FAF8F4";
  const brandReadsOnLight = contrastRatio(cardBg, LIGHT_BG) >= 3.2;
  const pageBg = light ? LIGHT_BG : cardBg;
  const pageFg = photoSrc
    ? cardFg
    : light
    ? brandReadsOnLight
      ? cardBg
      : "#1C1917"
    : cardFg;
  const tileBorder = light ? "#00000022" : "#00000014";
  const gridPrimary = light ? LIGHT_BG : cardBg;
  const gridText = light ? pageFg : cardFg;

  const wantGrid = showGridOpt && (fmt.tier === "lg" || fmt.tier === "md");

  const [qrDataUrl, grid] = await Promise.all([
    QRCode.toDataURL(cardUrl, {
      margin: 1,
      width: 600,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    }),
    // Tomt stempel-gitter (samme ikoner som kortet). Transparent PNG, saa det
    // lander rent paa baggrunden, tegnet i den valgte laesbare farve.
    wantGrid
      ? buildStripImages({
          stamps: 0,
          required,
          stampIcon,
          primaryColor: gridPrimary,
          textColor: gridText,
          print: true,
        })
      : null,
  ]);

  // Billedet beskaeres paa serveren til sidens praecise format (react-pdf's
  // objectFit: cover zoomede forskelligt paa A4, A5 og A6). 2 px pr. punkt.
  const PAGE_PT = { A4: [595.28, 841.89], A5: [419.53, 595.28], A6: [297.64, 419.53] } as const;
  const dims = PAGE_PT[(typeof fmt.pageSize === "string" && fmt.pageSize in PAGE_PT ? fmt.pageSize : "A4") as keyof typeof PAGE_PT];
  let photo: string | null = null;
  if (photoSrc && fmt.tier !== "xs") {
    try {
      const raw = Buffer.from(photoSrc.split(",")[1] ?? "", "base64");
      const cropped = await sharp(raw)
        .resize(Math.round(dims[0] * 2), Math.round(dims[1] * 2), { fit: "cover", position: "attention" })
        .jpeg({ quality: 82 })
        .toBuffer();
      photo = `data:image/jpeg;base64,${cropped.toString("base64")}`;
    } catch {
      photo = null;
    }
  }

  let stampGrid: string | null = null;
  let stampAspect = 2;
  if (grid) {
    const meta = await sharp(grid.x2).metadata();
    stampAspect = (meta.width ?? 1125) / (meta.height ?? 516);
    stampGrid = `data:image/png;base64,${grid.x2.toString("base64")}`;
  }

  const element = MaterialsPdf({
    businessName: business.name,
    qrDataUrl,
    rewardText: rewardLine,
    footline: posterFootline(focus),
    photo,
    logoUrl: business.logoUrl,
    pageSize: fmt.pageSize,
    tier: fmt.tier,
    pageBg,
    pageFg,
    tileBorder,
    headline,
    showBrand,
    stampGrid,
    stampAspect,
    logoOnTile: !light,
  });
  const buffer = await renderToBuffer(element);

  // "Hent PDF" i dashboardet: plakaten er lavet (Kom i gang-trinnet krydses af).
  if (!slug && sp.get("hent") === "1") {
    await prisma.business.update({ where: { id: business.id }, data: { posterMadeAt: new Date() } }).catch(() => {});
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${business.slug}-${focus === "henvis" ? "henvis" : "kort"}-${fmt.file}.pdf"`,
      // Altid frisk: aendres billede eller farver under Design, skal plakaten foelge med.
      "cache-control": "no-store",
    },
  });
}
