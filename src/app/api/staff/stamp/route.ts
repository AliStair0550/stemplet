import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { loadCardBySerial, applyStamp, StampError } from "@/lib/stamp";
import { staffStampSchema } from "@/lib/validation";
import { clientIp, apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scan-modus: personalet scanner kundens kort og stempler.
export async function POST(req: NextRequest) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = staffStampSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldigt kort.");

  const cc = await loadCardBySerial(parsed.data.serial);
  if (!cc || cc.card.businessId !== businessId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.");
  }

  try {
    const res = await applyStamp({
      customerCardId: cc.id,
      method: "STAFF_SCAN",
      ip: clientIp(req),
      // Personalet staar ved disken - ingen cooldown paa manuel stempling.
      skipCooldown: true,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
