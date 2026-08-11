import type { NextRequest } from "next/server";
import path from "node:path";
import QRCode from "qrcode";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";
import {
  isQrFormat,
  normalizeOrient,
  defaultOrient,
  clampName,
  QR_PRINT_HEADLINE,
  QR_PRINT_HELPER,
} from "@/lib/qr-print";
import { QrPrintDoc } from "./PrintDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Samme brand-font som de oevrige print-materialer. Registreres paa samme
// react-pdf-instans som renderToBuffer, saa den altid er indlejret i PDF'en.
Font.register({
  family: "Instrument Sans",
  fonts: [
    {
      src: path.join(process.cwd(), "src/fonts/InstrumentSans-Regular.ttf"),
      fontWeight: 400,
    },
    {
      src: path.join(process.cwd(), "src/fonts/InstrumentSans-Bold.ttf"),
      fontWeight: 700,
    },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const withCard = {
  cards: { take: 1, orderBy: { createdAt: "asc" as const } },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ format: string }> },
) {
  const { format: raw } = await params;
  if (!isQrFormat(raw)) {
    return new Response("Ukendt format.", { status: 404 });
  }
  const format = raw;

  // PDF-generering er tung: bremse pr. enhed, saa endpointet ikke kan hamres.
  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("qr-print", ip, 40, 300))) {
    return new Response("For mange forespørgsler. Prøv igen om lidt.", {
      status: 429,
    });
  }

  // Offentlig adgang via ?slug= (bruges i oprettelsen, foer der er et login).
  // Alt paa materialet (navn, logo, farver, QR til /k/slug) er i forvejen
  // offentligt via det offentlige kort, saa slug-adgang laekker intet.
  const slug = req.nextUrl.searchParams.get("slug")?.trim();
  let business = null;
  if (slug) {
    business = await prisma.business.findUnique({
      where: { slug },
      include: withCard,
    });
  } else {
    const session = await auth();
    const businessId = session?.user?.businessId;
    if (businessId) {
      business = await prisma.business.findUnique({
        where: { id: businessId },
        include: withCard,
      });
    }
  }

  // Download er foerst mulig, naar butik OG kort findes (QR peger paa kortet).
  if (!business || business.cards.length === 0) {
    return new Response("Ikke fundet.", { status: slug ? 404 : 401 });
  }

  const orientation = normalizeOrient(
    req.nextUrl.searchParams.get("orient"),
    defaultOrient(format),
  );
  const disposition =
    req.nextUrl.searchParams.get("disp") === "inline" ? "inline" : "attachment";

  const cardUrl = `${APP_URL}/k/${business.slug}`;

  try {
    // QR som vektor-matrix. Fejlkorrektion M giver god scanbarhed uden at goere
    // moenstret unoedigt taet.
    const qr = QRCode.create(cardUrl, { errorCorrectionLevel: "M" });

    const element = QrPrintDoc({
      format,
      orientation,
      businessName: clampName(business.name, format === "visitkort" ? 30 : 42),
      headline: QR_PRINT_HEADLINE,
      helper: QR_PRINT_HELPER,
      logoUrl: business.logoUrl,
      primaryColor: business.primaryColor,
      textColor: business.textColor,
      qr: { size: qr.modules.size, data: qr.modules.data },
    });
    const buffer = await renderToBuffer(element);

    const fileTag = format === "a4" ? "a4" : "visitkort";
    return new Response(new Uint8Array(buffer), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `${disposition}; filename="stemplet-${business.slug}-${fileTag}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (e) {
    captureServerError(e, {
      route: "qr-print",
      extra: { slug: business.slug, format, orientation },
    });
    return new Response("Kunne ikke lave PDF'en.", { status: 500 });
  }
}
