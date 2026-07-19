import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { loadCardBySerial, applyStamp, StampError } from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/redis";
import { runOnce, IdempotencyInFlight } from "@/lib/idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/v1/stamp  { "serial": "ABC123" }
// Giver et stempel via API-nøgle (fx fra et kassesystem). Ingen cooldown -
// systemet bestemmer selv, hvornaar der stemples.
//
// Idempotens: send en valgfri "Idempotency-Key"-header. Et retry efter et tabt
// svar (typisk paa maskin-til-maskin-integrationer) returnerer saa det foerste
// resultat i stedet for at give kunden et ekstra stempel.
export async function POST(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  // Rate limit pr. virksomhed: rigeligt til travle kasser, men stopper løbske
  // scripts. Fail-open hvis Redis ikke svarer.
  if (!(await checkRateLimit("api-v1-stamp", 300, "1 m", business.id))) {
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
      ? `v1:${business.id}:${rawIdem}`
      : undefined;

  try {
    const res = await runOnce(idemKey, () =>
      applyStamp({
        customerCardId: cc.id,
        method: "MANUAL",
        ip: clientIp(req),
        skipCooldown: true,
      }),
    );
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    // Samtidigt identisk forsoeg er stadig i gang: bed om et roligt retry.
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Stemplet behandles. Prøv igen om lidt.", 409);
    }
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
