import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { MaterialsPdf } from "./Doc";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const size = type === "skilt" ? "A6" : "A4";

  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return new Response("Ikke logget ind.", { status: 401 });

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    include: { cards: { take: 1, orderBy: { createdAt: "asc" } } },
  });
  if (!business) return new Response("Ikke fundet.", { status: 404 });

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
    size,
  });
  const buffer = await renderToBuffer(element);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="stemplet-${size === "A6" ? "diskskilt" : "plakat"}.pdf"`,
    },
  });
}
