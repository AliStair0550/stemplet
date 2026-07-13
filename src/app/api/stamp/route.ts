import { NextResponse, type NextRequest } from "next/server";
import { verifyStampToken, consumeJti } from "@/lib/tokens";
import { getCardToken, cardCookieName, cardCookieOptions } from "@/lib/cookies";
import {
  loadCardByToken,
  applyStamp,
  createCustomerCard,
  StampError,
} from "@/lib/stamp";
import { clientIp, apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Stempel-endpoint. Kundens kamera rammer /s/[token], som poster hertil.
export async function POST(req: NextRequest) {
  let token: string | undefined;
  // known: kortets authToken gemt i klientens localStorage. Bruges som robust
  // fallback, hvis device-cookien ikke holdt (iOS Safari persisterer ikke altid
  // Set-Cookie fra fetch). Saa genkender telefonen ALTID sit eget kort i stedet
  // for at oprette et nyt ved hver scanning.
  let known: string | undefined;
  try {
    const body = await req.json();
    token = body?.token;
    if (typeof body?.known === "string" && body.known.length > 0) {
      known = body.known;
    }
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

  // Find kundens kort via device-cookie. Har kunden intet kort (ny kunde),
  // eller peger cookien paa et slettet/andet kort, oprettes et nyt kort
  // automatisk. Saa faar en ny kunde sit foerste stempel med det samme og
  // lander direkte paa "Laeg i Apple Wallet", uden en mellemskaerm.
  const cardToken = await getCardToken(payload.businessId);
  let cc = cardToken ? await loadCardByToken(cardToken) : null;
  if (cc && cc.card.businessId !== payload.businessId) cc = null;

  // Fallback: klientens gemte kort-token (localStorage), hvis cookien svigtede.
  if (!cc && known) {
    const kcc = await loadCardByToken(known);
    if (kcc && kcc.card.businessId === payload.businessId) cc = kcc;
  }

  let createdCard = false;
  // Token til en NY device-cookie. Saettes DIREKTE paa svaret (NextResponse)
  // nedenfor, ikke via cookies().set() i route-handleren: sidstnaevnte holdt
  // ikke paalideligt, saa hver scanning oprettede et nyt kort i stedet for at
  // samle op paa det samme.
  let newCookieToken: string | null = null;
  if (!cc) {
    const created = await createCustomerCard(payload.businessId);
    if (!created.ok) {
      // Butikken har ramt sit gratis-loft: send til claim-siden i stedet for
      // en blindgyde. (Sjaeldent: kun paa Gratis ved loftet.)
      return apiError(
        "NO_CARD",
        "Butikken tager ikke imod nye stempelkort lige nu.",
        200,
        { needCard: true, businessId: payload.businessId },
      );
    }
    newCookieToken = created.authToken;
    cc = await loadCardByToken(created.authToken);
    createdCard = true;
    if (!cc) return apiError("SERVER", "Noget gik galt. Prøv igen.", 500);
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
    // created: nyoprettet kort (foerste stempel) -> klienten kan vise et
    // "Velkommen"-oejeblik og saette Wallet som den ene handling.
    const response = NextResponse.json({
      ok: true,
      created: createdCard,
      // Kortets token tilbage til klienten, saa den kan gemme den i
      // localStorage og genkende SAMME kort ved naeste scanning.
      cardToken: cc.authToken,
      ...res,
    });
    if (newCookieToken) {
      // Cookien saettes paa svaret her, saa den holder paa tvaers af
      // scanninger og kunden samler op paa SAMME kort.
      response.cookies.set(
        cardCookieName(payload.businessId),
        newCookieToken,
        cardCookieOptions(),
      );
    }
    return response;
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
