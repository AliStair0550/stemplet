import type { NextRequest } from "next/server";
import { requireKasseBusinessId } from "@/lib/kasse";
import { cardIdInBusiness, undoLastStamp, StampError } from "@/lib/stamp";
import { staffStampSchema } from "@/lib/validation";
import { clientIp, apiError } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fortryd sidste stempel (personalet kom til at taste for mange gange).
export async function POST(req: NextRequest) {
  const businessId = await requireKasseBusinessId();
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = staffStampSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldigt kort.");

  const ccId = await cardIdInBusiness(parsed.data.serial, businessId);
  if (!ccId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.");
  }

  try {
    // Idempotens: et tabt svar + retry med samme noegle fjerner IKKE et ekstra
    // stempel (noeglen gemmes paa kortet i databasen).
    const res = await undoLastStamp({
      customerCardId: ccId,
      ip: clientIp(req),
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    captureServerError(e, { route: "staff/unstamp", businessId });
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
