import { NextResponse, type NextRequest } from "next/server";
import { getCardToken } from "@/lib/cookies";
import { loadCardByToken } from "@/lib/stamp";
import { loadDemoBusiness } from "@/lib/demo";
import { prisma } from "@/lib/prisma";
import { clientIp, apiError } from "@/lib/http";
import { durableRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Prøv det selv": nulstil demo-kortet, saa den besoegende kan koere loopet igen.
// Kun demo-butikkens eget kort paa denne enhed.
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
  if (!(await durableRateLimit("demo-reset", ip, 30, 300))) {
    return apiError("RATE_LIMIT", "Prøv igen om lidt.", 429);
  }

  await prisma.customerCard.update({
    where: { id: cc.id },
    data: { stamps: 0, lastStampAt: null },
  });
  // Wallet-passet opdateres til det nulstillede kort.
  try {
    const { pushWalletUpdate } = await import("@/lib/wallet/apns");
    void pushWalletUpdate(cc.id);
  } catch {
    // push er ekstra, ikke kritisk for demoen
  }

  return NextResponse.json({
    ok: true,
    serial: cc.serial,
    stamps: 0,
    required: cc.card.stampsRequired,
  });
}
