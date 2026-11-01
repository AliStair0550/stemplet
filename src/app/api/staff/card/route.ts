import type { NextRequest } from "next/server";
import { requireKasseBusinessId } from "@/lib/kasse";
import { prisma } from "@/lib/prisma";
import { cardTitle } from "@/lib/brand";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Personalet slaar kortets aktuelle tilstand op efter scanning, saa de ser
// status (og om der er en belønning klar) foer de handler.
export async function GET(req: NextRequest) {
  const businessId = await requireKasseBusinessId();
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const serial = req.nextUrl.searchParams.get("serial")?.trim();
  if (!serial) return apiError("BAD_REQUEST", "Mangler kort.");

  // Eet opslag med kun det, kassen viser (og butikken i filteret).
  const cc = await prisma.customerCard.findFirst({
    where: { serial, card: { businessId } },
    select: {
      serial: true,
      name: true,
      stamps: true,
      completedCount: true,
      lifetimeStamps: true,
      card: {
        select: {
          stampsRequired: true,
          rewardText: true,
          stampIcon: true,
          business: { select: { name: true, displayName: true, primaryColor: true, textColor: true } },
        },
      },
    },
  });
  if (!cc) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.", 404);
  }

  return Response.json({
    ok: true,
    serial: cc.serial,
    name: cc.name,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    rewardReady: cc.stamps >= cc.card.stampsRequired,
    rewardText: cc.card.rewardText,
    stampIcon: cc.card.stampIcon,
    primaryColor: cc.card.business.primaryColor,
    textColor: cc.card.business.textColor,
    businessName: cardTitle(cc.card.business),
    completedCount: cc.completedCount,
    lifetimeStamps: cc.lifetimeStamps,
  });
}
