import type { NextRequest } from "next/server";
import { requireKasseBusinessId } from "@/lib/kasse";
import { loadCardBySerial } from "@/lib/stamp";
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

  const cc = await loadCardBySerial(serial);
  if (!cc || cc.card.businessId !== businessId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.", 404);
  }

  return Response.json({
    ok: true,
    serial: cc.serial,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    rewardReady: cc.stamps >= cc.card.stampsRequired,
    rewardText: cc.card.rewardText,
    stampIcon: cc.card.stampIcon,
    primaryColor: cc.card.business.primaryColor,
    textColor: cc.card.business.textColor,
    businessName: cc.card.business.name,
    completedCount: cc.completedCount,
  });
}
