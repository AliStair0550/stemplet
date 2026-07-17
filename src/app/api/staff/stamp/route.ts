import type { NextRequest } from "next/server";
import { kasseAccess } from "@/lib/kasse";
import { loadCardBySerial, applyStamp, StampError } from "@/lib/stamp";
import { staffStampSchema } from "@/lib/validation";
import { clientIp, apiError } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";
import { runOnce, IdempotencyInFlight } from "@/lib/idempotency";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Scan-modus: personalet scanner kundens kort og stempler.
export async function POST(req: NextRequest) {
  const access = await kasseAccess(true);
  if (!access) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = staffStampSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldigt kort.");

  const cc = await loadCardBySerial(parsed.data.serial);
  if (!cc || cc.card.businessId !== access.businessId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.");
  }

  try {
    // Idempotens: sender klienten samme noegle igen (fx et retry efter et tabt
    // svar paa daarligt wifi), returneres det foerste resultat i stedet for at
    // give kunden endnu et stempel.
    const res = await runOnce(parsed.data.idempotencyKey, () =>
      applyStamp({
        customerCardId: cc.id,
        method: "STAFF_SCAN",
        ip: clientIp(req),
        // Personalet staar ved disken - ingen cooldown paa manuel stempling.
        skipCooldown: true,
        // Antal stempler personalet valgte (fx tre kaffe = 3).
        count: parsed.data.count,
        // Medarbejder-attribution: parret enhed ELLER ejer-login.
        staffUserId: access.source === "owner" ? access.userId ?? null : null,
        staffDeviceId: access.source === "device" ? access.deviceId ?? null : null,
      }),
    );
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    // Samtidigt identisk forsoeg er stadig i gang: bed om et roligt retry (ingen
    // fejl-rapportering, det er forventet paa daarligt net).
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Stemplet behandles. Prøv igen om lidt.", 409);
    }
    captureServerError(e, {
      route: "staff/stamp",
      businessId: access.businessId,
    });
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
