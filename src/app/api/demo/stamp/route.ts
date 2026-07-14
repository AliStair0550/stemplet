import { NextResponse, type NextRequest } from "next/server";
import { getCardToken } from "@/lib/cookies";
import { loadCardByToken, applyStamp, StampError } from "@/lib/stamp";
import { loadDemoBusiness } from "@/lib/demo";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Prøv det selv": den besoegende giver sig selv ét stempel og ser kortet
// opdatere live (ogsaa i Wallet, hvis de har lagt det ind). Kun demo-butikken.
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
  if (!biz) {
    return apiError("UNAVAILABLE", "Demoen er ikke tilgængelig.", 200, {
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
  if (!cc) {
    return apiError("NO_CARD", "Hent demo-kortet først.", 200, {
      needCard: true,
    });
  }

  const ip = clientIp(req) ?? "ukendt";
  if (!(await durableRateLimit("demo-stamp", ip, 40, 300))) {
    return apiError("RATE_LIMIT", "Prøv igen om lidt.", 429);
  }

  try {
    // skipCooldown: demoen skal kunne stemples i et hurtigt tempo.
    const r = await applyStamp({
      customerCardId: cc.id,
      method: "STAFF_SCAN",
      ip,
      skipCooldown: true,
    });
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    if (e instanceof StampError) {
      // Fx fuldt kort: ikke en "fejl" i demoen, bare enden paa loopet.
      return apiError(e.code, e.message, 200, {
        serial: cc.serial,
        stamps: cc.stamps,
        required: cc.card.stampsRequired,
        rewardReady: cc.stamps >= cc.card.stampsRequired,
      });
    }
    console.error("demo-stempel fejl", e);
    return apiError("SERVER", "Noget gik galt. Prøv igen.", 500);
  }
}
