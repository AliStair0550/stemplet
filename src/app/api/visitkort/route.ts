import type { NextRequest } from "next/server";
import path from "node:path";
import QRCode from "qrcode";
import { renderToBuffer, Font } from "@react-pdf/renderer";
import { getSessionBusinessId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { clientIp } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";
import { cardTitle } from "@/lib/brand";
import { visitkortSchema } from "@/lib/visitkort";
import { VisitkortDoc } from "./VisitkortDoc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const element = VisitkortDoc({
      design,
      businessName: cardTitle(business),
      logoUrl: business.logoUrl,
      rewardText: business.cards[0]?.rewardText ?? "10. på huset",
      stampsRequired: business.cards[0]?.stampsRequired ?? 10,
      qr: { size: qr.modules.size, data: qr.modules.data },
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
