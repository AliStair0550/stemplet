import type { NextRequest } from "next/server";
import { verifyStampToken, consumeJti } from "@/lib/tokens";
import { getCardToken } from "@/lib/cookies";
import { loadCardByToken, applyStamp, StampError } from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stempel-endpoint. Kundens kamera rammer /s/[token], som poster hertil.
export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    const body = await req.json();
    token = body?.token;
  } catch {
    return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  }
  if (!token) return apiError("BAD_REQUEST", "Mangler token.");

  let payload;
  try {
    payload = await verifyStampToken(token);
  } catch {
    return apiError(
      "EXPIRED",
      "Koden er udløbet. Bed personalet om at vise en ny.",
    );
  }

  // Find kundens kort via device-cookie for netop denne virksomhed.
  const cardToken = await getCardToken(payload.businessId);
  if (!cardToken) {
    return apiError(
      "NO_CARD",
      "Du har ikke et stempelkort endnu. Hent det først.",
      200,
      { needCard: true, businessId: payload.businessId },
    );
  }
  const cc = await loadCardByToken(cardToken);
  if (!cc || cc.card.businessId !== payload.businessId) {
    return apiError("NO_CARD", "Kortet passer ikke til denne butik.");
  }

  // Replay-beskyttelse: jti kan kun bruges een gang.
  const fresh = await consumeJti(payload.jti);
  if (!fresh) {
    return apiError(
      "REPLAY",
      "Koden er allerede brugt. Bed personalet om at vise en ny.",
    );
  }

  try {
    const res = await applyStamp({
      customerCardId: cc.id,
      method: "KIOSK_QR",
      tokenJti: payload.jti,
      ip: clientIp(req),
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error("Stempel-fejl", e);
    return apiError("SERVER", "Noget gik galt. Prøv igen.", 500);
  }
}
