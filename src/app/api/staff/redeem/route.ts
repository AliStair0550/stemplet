import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
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

// Indloesning kraever personale-PIN. 3 fejl laaser enheden i 5 minutter.
export async function POST(req: NextRequest) {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return apiError("UNAUTHORIZED", "Ikke logget ind.", 401);

  const parsed = redeemSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Udfyld kort og PIN.");

  const deviceId = await ensureDeviceId();

  const locked = await pinLockRemaining(businessId, deviceId);
  if (locked > 0) {
    return apiError(
      "LOCKED",
      `For mange forkerte forsoeg. Proev igen om ${Math.ceil(locked / 60)} min.`,
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business) return apiError("UNAUTHORIZED", "Virksomhed mangler.", 401);

  const ok = await verifyPin(parsed.data.pin, business.staffPin);
  if (!ok) {
    const fail = await recordPinFail(businessId, deviceId);
    await prisma.auditLog.create({
      data: {
        businessId,
        action: "PIN_FAIL",
        ip: clientIp(req),
        detail: { serial: parsed.data.serial, locked: fail.locked },
      },
    });
    return apiError(
      "PIN",
      fail.locked
        ? "Indloesning laast i 5 minutter."
        : "Forkert PIN. Proev igen.",
    );
  }
  await clearPinFails(businessId, deviceId);

  const cc = await loadCardBySerial(parsed.data.serial);
  if (!cc || cc.card.businessId !== businessId) {
    return apiError("NOT_FOUND", "Kortet hoerer ikke til din butik.");
  }

  try {
    const res = await redeemReward({
      customerCardId: cc.id,
      ip: clientIp(req),
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof StampError) return apiError(e.code, e.message);
    console.error(e);
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
