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
import { captureServerError } from "@/lib/sentry";
import { cardTitle, type StampIconKey } from "@/lib/brand";
import { visitkortSchema } from "@/lib/visitkort-schema";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import { VisitkortDoc } from "./VisitkortDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MM = 72 / 25.4;
const BLEED = 3 * MM;

// Rasteriserer en fuld-bleed baggrund (farve + fliselagte stempel-ikoner) til en
// PNG-data-URL, saa PDF'en faar samme brandede look som kortets landingsside.
async function iconBackground(
  bg: string,
  text: string,
  markup: string,
  wPt: number,
  hPt: number,
): Promise<string> {
  const scale = 4; // ~288 dpi
  const W = Math.round(wPt * scale);
  const H = Math.round(hPt * scale);
  const tile = 112;
  const iconScale = (tile / 24) * 0.42;
  let tiles = "";
  for (let y = -tile; y < H + tile; y += tile) {
    for (let x = -tile; x < W + tile; x += tile) {
      const ox = (Math.floor(y / tile) % 2) * (tile / 2);
      tiles += `<g transform="translate(${x + ox},${y}) scale(${iconScale}) rotate(-8)"><g fill="none" stroke="${text}" stroke-opacity="0.08" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${markup}</g></g>`;
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${bg}"/>${tiles}</svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

// Instrument Sans indlejres (samme react-pdf-instans). Serif/mono i designet
// bruger PDF'ens indbyggede standardfonts (Times/Courier) og kraever ingen fil.
Font.register({
  family: "Instrument Sans",
  fonts: [
    { src: path.join(process.cwd(), "src/fonts/InstrumentSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(process.cwd(), "src/fonts/InstrumentSans-Bold.ttf"), fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

export async function POST(req: NextRequest) {
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("visitkort-pdf", ip, 40, 300))) {
    return new Response("For mange forespørgsler. Prøv igen om lidt.", { status: 429 });
  }

  const businessId = await getSessionBusinessId();
  if (!businessId) return new Response("Ikke logget ind.", { status: 401 });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { cards: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  if (!business) return new Response("Ikke fundet.", { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Ugyldig forespørgsel.", { status: 400 });
  }
  const parsed = visitkortSchema.safeParse((body as { design?: unknown })?.design);
  if (!parsed.success) {
    return new Response("Ugyldigt design.", { status: 400 });
  }
  const design = parsed.data;

  const cardUrl = `${APP_URL}/k/${business.slug}`;
  try {
    const qr = QRCode.create(cardUrl, { errorCorrectionLevel: "M" });

    // Ikon-baggrund (samme look som landingssiden), rasteriseret pr. side.
    let frontBgImage: string | null = null;
    let backBgImage: string | null = null;
    if (design.background === "ikoner") {
      const land = design.orientation === "landscape";
      const pageW = ((land ? 85 : 55) * MM) + BLEED * 2;
      const pageH = ((land ? 55 : 85) * MM) + BLEED * 2;
      const icon = (business.cards[0]?.stampIcon as StampIconKey) ?? "coffee";
      const markup = STAMP_ICON_PATHS[icon] ?? STAMP_ICON_PATHS.custom;
      [frontBgImage, backBgImage] = await Promise.all([
        iconBackground(design.front.bg, design.front.text, markup, pageW, pageH),
        iconBackground(design.back.bg, design.back.text, markup, pageW, pageH),
      ]);
    }

    const element = VisitkortDoc({
      design,
      businessName: cardTitle(business),
      logoUrl: business.logoUrl,
      rewardText: business.cards[0]?.rewardText ?? "10. på huset",
      stampsRequired: business.cards[0]?.stampsRequired ?? 10,
      qr: { size: qr.modules.size, data: qr.modules.data },
      frontBgImage,
      backBgImage,
    });
    const buffer = await renderToBuffer(element);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="stemplet-visitkort-${business.slug}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    captureServerError(e, { route: "visitkort-pdf", extra: { slug: business.slug } });
    return new Response("Kunne ikke lave PDF'en.", { status: 500 });
  }
}
