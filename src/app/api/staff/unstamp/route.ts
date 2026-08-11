import type { NextRequest } from "next/server";
import { requireKasseBusinessId } from "@/lib/kasse";
import { loadCardBySerial, undoLastStamp, StampError } from "@/lib/stamp";
import { staffStampSchema } from "@/lib/validation";
import { clientIp, apiError } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";
import { runOnce, IdempotencyInFlight } from "@/lib/idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Fortryd sidste stempel (personalet kom til at taste for mange gange).
export async function POST(req: NextRequest) {
  const businessId = await requireKasseBusinessId();
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = staffStampSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldigt kort.");

  const cc = await loadCardBySerial(parsed.data.serial);
  if (!cc || cc.card.businessId !== businessId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.");
  }

  try {
    // Idempotens: et tabt svar + retry med samme noegle fjerner IKKE et ekstra
    // stempel, men returnerer foerste fortryd-resultat.
    const res = await runOnce(
      parsed.data.idempotencyKey
        ? `unstamp:${businessId}:${parsed.data.idempotencyKey}`
        : undefined,
      () => undoLastStamp({ customerCardId: cc.id, ip: clientIp(req) }),
    );
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Fortryd behandles. Prøv igen om lidt.", 409);
    }
    captureServerError(e, { route: "staff/unstamp", businessId });
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
