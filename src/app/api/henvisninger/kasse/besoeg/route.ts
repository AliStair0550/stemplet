import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  referralKasse,
  noAccess,
  referralErrorResponse,
  pushReferralWallet,
  checkStaffPin,
} from "@/lib/referral-kasse";
import { recordFirstVisit, ReferralError } from "@/lib/referral";
import { IdempotencyInFlight } from "@/lib/idempotency";
import { apiError, clientIp } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";
import { expireBusinessStats } from "@/lib/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  referralId: z.string().min(1).max(40),
  idempotencyKey: z.string().max(80).optional(),
  pin: z.string().max(12).optional(),
});

// "Rabat givet": vennens foerste besoeg. created -> rewarded via tilstandsmaskinen,
// og vennens rabat indloeses i samme transaktion (een knap). Ambassadoerens
// beloenning staar klar til senere. Staff-id og idempotency key fra kassen; PIN
// som ved indloesning (kun hvis butikken har sat en), da rabatten indloeses her.
export async function POST(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  const pinError = await checkStaffPin(kasse, parsed.data.pin, clientIp(req), {
    referralId: parsed.data.referralId,
  });
  if (pinError) return pinError;
  try {
    const res = await recordFirstVisit({
      referralId: parsed.data.referralId,
      businessId: kasse.businessId,
      staffUserId: kasse.staffUserId,
      staffDeviceId: kasse.staffDeviceId,
      idempotencyKey: parsed.data.idempotencyKey,
      redeemNewCustomerReward: true,
    });
    // Begge kort (ny kunde + ambassadoer) faar deres nye beloenning i Wallet.
    pushReferralWallet(res.rewards.map((r) => r.cardId));
    expireBusinessStats(kasse.businessId);
    return Response.json({ ok: true, ...res });
  } catch (e) {
    if (e instanceof ReferralError) return referralErrorResponse(e);
    if (e instanceof IdempotencyInFlight) {
      return apiError("RETRY", "Behandles. Prøv igen om lidt.", 409);
    }
    captureServerError(e, { route: "henvisninger/besoeg", businessId: kasse.businessId });
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
