import { NextResponse, type NextRequest } from "next/server";
import {
  getCardToken,
  cardCookieName,
  cardCookieOptions,
} from "@/lib/cookies";
import { loadCardByToken, createCustomerCard } from "@/lib/stamp";
import { loadDemoBusiness } from "@/lib/demo";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Prøv det selv": sikrer at den besoegende har et demo-kort (genkendes paa
// device-cookie eller localStorage-token), saa de kan laegge det i Wallet og
// stemple sig selv. Kun demo-butikken, aldrig en rigtig butik.
export async function POST(req: NextRequest) {
  let known: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.known === "string" && body.known.length > 0) {
      known = body.known;
    }
  } catch {
    // tom body er fint
  }

  const biz = await loadDemoBusiness();
  if (!biz || biz.cards.length === 0) {
    return apiError("UNAVAILABLE", "Demoen er ikke tilgængelig lige nu.", 200, {
      unavailable: true,
    });
  }

  const token = await getCardToken(biz.id);
  let cc = token ? await loadCardByToken(token) : null;
  if (cc && cc.card.businessId !== biz.id) cc = null;
  if (!cc && known) {
    const k = await loadCardByToken(known);
    if (k && k.card.businessId === biz.id) cc = k;
  }

  let newCookieToken: string | null = null;
  if (!cc) {
    const ip = clientIp(req) ?? "ukendt";
    if (!(await durableRateLimit("demo-card", ip, 20, 600))) {
      return apiError("RATE_LIMIT", "Prøv igen om lidt.", 429);
    }
    const created = await createCustomerCard(biz.id);
    if (!created.ok) {
      return apiError(
        "UNAVAILABLE",
        "Demoen er ikke tilgængelig lige nu.",
        200,
        { unavailable: true },
      );
    }
    newCookieToken = created.authToken;
    cc = await loadCardByToken(created.authToken);
    if (!cc) return apiError("SERVER", "Noget gik galt. Prøv igen.", 500);
  }

  const res = NextResponse.json({
    ok: true,
    serial: cc.serial,
    stamps: cc.stamps,
    required: cc.card.stampsRequired,
    cardToken: cc.authToken,
  });
  if (newCookieToken) {
    res.cookies.set(
      cardCookieName(biz.id),
      newCookieToken,
      cardCookieOptions(),
    );
  }
  return res;
}
