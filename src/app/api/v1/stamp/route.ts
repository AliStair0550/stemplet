import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { loadCardBySerial, applyStamp, StampError } from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/stamp  { "serial": "ABC123" }
// Giver et stempel via API-nøgle (fx fra et kassesystem). Ingen cooldown -
// systemet bestemmer selv, hvornaar der stemples.
export async function POST(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  const body = await req.json().catch(() => ({}));
  const serial = String(body?.serial ?? "").trim();
  if (!serial) return apiError("BAD_REQUEST", "Mangler 'serial'.");

  const cc = await loadCardBySerial(serial);
  if (!cc || cc.card.businessId !== business.id) {
    return apiError("NOT_FOUND", "Kortet findes ikke i din butik.", 404);
  }

  try {
    const res = await applyStamp({
      customerCardId: cc.id,
      method: "MANUAL",
      ip: clientIp(req),
      skipCooldown: true,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
