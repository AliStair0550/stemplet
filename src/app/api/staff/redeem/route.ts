import type { NextRequest } from "next/server";
import { requireKasseBusinessId } from "@/lib/kasse";
import { prisma } from "@/lib/prisma";
import { loadCardBySerial, redeemReward, StampError } from "@/lib/stamp";
import { redeemSchema } from "@/lib/validation";
import {
  verifyPin,
  recordPinFail,
  clearPinFails,
  pinLockRemaining,
} from "@/lib/security";
import { ensureDeviceId } from "@/lib/cookies";
import { clientIp, apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Indløsning kræver personale-PIN. 3 fejl låser enheden i 5 minutter.
export async function POST(req: NextRequest) {
  const businessId = await requireKasseBusinessId();
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = redeemSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Udfyld kort og PIN.");

  const deviceId = await ensureDeviceId();
  const ip = clientIp(req);
  // Laas paa IP (svaerere at rotere end en cookie), ellers enheds-id.
  const lockId = ip ?? deviceId;

  let locked = 0;
  try {
    locked = await pinLockRemaining(businessId, lockId);
  } catch (e) {
    console.error("Redis (pin-lock) fejlede:", e);
  }
  if (locked > 0) {
    return apiError(
      "LOCKED",
      `For mange forkerte forsøg. Prøv igen om ${Math.ceil(locked / 60)} min.`,
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business) return apiError("UNAUTHORIZED", "Virksomhed mangler.", 401);

  const ok = await verifyPin(parsed.data.pin, business.staffPin);
  if (!ok) {
    let failLocked = false;
    try {
      const fail = await recordPinFail(businessId, lockId);
      failLocked = fail.locked;
    } catch (e) {
      console.error("Redis (pin-fail) fejlede:", e);
    }
    await prisma.auditLog.create({
      data: {
        businessId,
        action: "PIN_FAIL",
        ip,
        detail: { serial: parsed.data.serial, locked: failLocked },
      },
    });
    return apiError(
      "PIN",
      failLocked ? "Indløsning låst i 5 minutter." : "Forkert PIN. Prøv igen.",
    );
  }
  try {
    await clearPinFails(businessId, lockId);
  } catch {
    // ignorer - laasning er ekstra beskyttelse, ikke kritisk
  }

  const cc = await loadCardBySerial(parsed.data.serial);
  if (!cc || cc.card.businessId !== businessId) {
    return apiError("NOT_FOUND", "Kortet hører ikke til din butik.");
  }

  try {
    const res = await redeemReward({
      customerCardId: cc.id,
      ip,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
