import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { loadCardBySerial, redeemReward, StampError } from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";
import { apiWriteRateLimit } from "@/lib/rate-limit";
import { runOnce, IdempotencyInFlight } from "@/lib/idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/redeem  { "serial": "ABC123" }
// Indløser en fuld beloenning via API-nøgle. API-nøglen er selv legitimationen
// (ingen PIN her - den beskytter kun den manuelle kasse).
//
// Idempotens: send en valgfri "Idempotency-Key"-header. Et retry efter et tabt
// svar returnerer saa det foerste resultat i stedet for en misvisende FULL-fejl
// (kortet er allerede indloest), i tråd med /api/v1/stamp.
export async function POST(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  // Indløsning er sjældnere end stempling: strammere loft pr. virksomhed.
  // Fail-CLOSED (DB-backstop), hvis Redis ikke kan konsulteres.
  if (!(await apiWriteRateLimit("api-v1-redeem", business.id, 60, "1 m", 60))) {
    return apiError("RATE_LIMIT", "For mange kald. Prøv igen om lidt.", 429);
  }

  const body = await req.json().catch(() => ({}));
  const serial = String(body?.serial ?? "").trim();
  if (!serial) return apiError("BAD_REQUEST", "Mangler 'serial'.");

  const cc = await loadCardBySerial(serial);
  if (!cc || cc.card.businessId !== business.id) {
    return apiError("NOT_FOUND", "Kortet findes ikke i din butik.", 404);
  }

  // Noeglen scopes pr. butik, saa to butikker ikke kan kollidere paa samme vaerdi.
  const rawIdem = req.headers.get("idempotency-key")?.trim();
  const idemKey =
    rawIdem && rawIdem.length >= 1 && rawIdem.length <= 200
      ? `v1-redeem:${business.id}:${rawIdem}`
      : undefined;

  try {
    const res = await runOnce(idemKey, () =>
      redeemReward({ customerCardId: cc.id, ip: clientIp(req) }),
    );
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Indløsningen behandles. Prøv igen om lidt.", 409);
    }
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
