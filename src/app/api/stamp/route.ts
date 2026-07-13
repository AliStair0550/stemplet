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
    // Cookien peger paa et kort der ikke laenger findes (fx nulstillet) eller en
    // anden butik: send kunden til at hente et nyt kort i stedet for en blindgyde.
    return apiError("NO_CARD", "Hent dit stempelkort her først.", 200, {
      needCard: true,
      businessId: payload.businessId,
    });
  }

  // Replay-beskyttelse PR. KORT: samme kort kan ikke bruge samme token to
  // gange, men en kø af forskellige kort kan dele samme skærm-QR. Redis er
  // primaer, den sammensatte unik [tokenJti, customerCardId] i databasen er
  // backstop, hvis Redis skulle fejle.
  let fresh = true;
  try {
    fresh = await consumeJti(payload.jti, cc.id);
  } catch (e) {
    console.error("Redis (jti) fejlede, stoler paa DB-unik:", e);
  }
  if (!fresh) {
    // Kunden har allerede brugt netop denne kode (typisk scannet skaerm-QR'en
    // to gange). Send serienr. med, saa vi kan sende dem hen til deres kort.
    return apiError("REPLAY", "Koden er allerede brugt.", 400, {
      serial: cc.serial,
    });
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
    // Kortet er kendt her, saa alle disse fejl faar serienr. med, saa kunden
    // altid kan komme videre til sit eget kort (og vise QR'en til personalet).
    if (e instanceof StampError) {
      return apiError(e.code, e.message, e.code === "COOLDOWN" ? 429 : 400, {
        serial: cc.serial,
      });
    }
    // DB-backstop: samme jti to gange rammer @unique (P2002) = replay.
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return apiError("REPLAY", "Koden er allerede brugt.", 400, {
        serial: cc.serial,
      });
    }
    console.error("Stempel-fejl", e);
    return apiError("SERVER", "Noget gik galt. Prøv igen.", 500);
  }
}
