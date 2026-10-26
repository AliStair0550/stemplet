import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  referralKasse,
  noAccess,
  referralErrorResponse,
  checkStaffPin,
} from "@/lib/referral-kasse";
import { redeemReward, ReferralError } from "@/lib/referral";
import { IdempotencyInFlight } from "@/lib/idempotency";
import { apiError, clientIp } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  rewardId: z.string().min(1).max(40),
  idempotencyKey: z.string().max(80).optional(),
  pin: z.string().max(12).optional(),
});

// "Beloenning indloest". PIN som i Stemplet: kun hvis butikken har sat en.
export async function POST(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");

  const ip = clientIp(req);
  const pinError = await checkStaffPin(kasse, parsed.data.pin, ip, {
    rewardId: parsed.data.rewardId,
  });
  if (pinError) return pinError;

  try {
    const res = await redeemReward({
      rewardId: parsed.data.rewardId,
      businessId: kasse.businessId,
      staffUserId: kasse.staffUserId,
      staffDeviceId: kasse.staffDeviceId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof ReferralError) return referralErrorResponse(e);
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Behandles. Prøv igen om lidt.", 409);
    }
    captureServerError(e, { route: "henvisninger/indloes", businessId: kasse.businessId });
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
