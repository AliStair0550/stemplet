import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { loadCardBySerial } from "@/lib/stamp";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/customers/{serial} - slaa et kort op.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ serial: string }> },
) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  const { serial } = await params;
  const cc = await loadCardBySerial(serial);
  if (!cc || cc.card.businessId !== business.id) {
    return apiError("NOT_FOUND", "Kortet findes ikke i din butik.", 404);
  }

  return Response.json({
    serial: cc.serial,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    rewardReady: cc.stamps >= cc.card.stampsRequired,
    rewardText: cc.card.rewardText,
    completedCount: cc.completedCount,
    contactEmail: cc.contactEmail,
    createdAt: cc.createdAt,
    lastStampAt: cc.lastStampAt,
  });
}
