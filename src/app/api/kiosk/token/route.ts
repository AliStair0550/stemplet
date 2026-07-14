import type { NextRequest } from "next/server";
import QRCode from "qrcode";
import { requireKasseBusinessId } from "@/lib/kasse";
import { prisma } from "@/lib/prisma";
import { signStampToken } from "@/lib/tokens";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kassemodus henter et nyt signeret token her hvert 60. sekund.
export async function GET(req: NextRequest) {
  const businessId = await requireKasseBusinessId();
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  // Selvbetjening skal vaere slaaet til for at vise en kunde-scanbar QR.
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { selfScanEnabled: true },
  });
  if (!business?.selfScanEnabled) {
    return apiError("SELF_SCAN_OFF", "Selvbetjening er slået fra.", 403);
  }

  const card = await prisma.card.findFirst({
    where: { businessId, active: true },
    orderBy: { createdAt: "asc" },
  });
  if (!card) return apiError("NO_CARD", "Opret et kort først.", 400);

  const { token, expiresInSeconds } = await signStampToken({
    businessId,
    cardId: card.id,
  });
  const origin = req.nextUrl.origin;
  const url = `${origin}/s/${token}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 720,
    errorCorrectionLevel: "M",
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return Response.json({ url, qrDataUrl, expiresInSeconds });
}
