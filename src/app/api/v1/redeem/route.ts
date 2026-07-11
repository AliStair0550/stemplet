import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { loadCardBySerial, redeemReward, StampError } from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/redeem  { "serial": "ABC123" }
// Indløser en fuld beloenning via API-nøgle. API-nøglen er selv legitimationen
// (ingen PIN her - den beskytter kun den manuelle kasse).
export async function POST(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  // Indløsning er sjældnere end stempling: strammere loft pr. virksomhed.
  if (!(await checkRateLimit("api-v1-redeem", 60, "1 m", business.id))) {
    return apiError("RATE_LIMIT", "For mange kald. Prøv igen om lidt.", 429);
  }

  const body = await req.json().catch(() => ({}));
  const serial = String(body?.serial ?? "").trim();
  if (!serial) return apiError("BAD_REQUEST", "Mangler 'serial'.");

  const cc = await loadCardBySerial(serial);
  if (!cc || cc.card.businessId !== business.id) {
    return apiError("NOT_FOUND", "Kortet findes ikke i din butik.", 404);
  }

  try {
    const res = await redeemReward({ customerCardId: cc.id, ip: clientIp(req) });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
