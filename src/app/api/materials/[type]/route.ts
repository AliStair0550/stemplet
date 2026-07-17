import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { MaterialsPdf, type MaterialTier } from "./Doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const withCard = {
  cards: { take: 1, orderBy: { createdAt: "asc" as const } },
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
    const session = await auth();
    const businessId = session?.user?.businessId;
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

  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 600,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  const element = MaterialsPdf({
    businessName: business.name,
    qrDataUrl,
    rewardText: business.cards[0]?.rewardText ?? "",
    logoUrl: business.logoUrl,
    pageSize: fmt.pageSize,
    tier: fmt.tier,
    // Butikkens egne kortfarver, saa skiltet matcher det designede kort.
    primaryColor: business.primaryColor,
    textColor: business.textColor,
  });
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="stemplet-${fmt.file}.pdf"`,
    },
  });
}
