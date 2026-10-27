import type { NextRequest } from "next/server";
import { z } from "zod";
import {
  referralKasse,
  noAccess,
  referralErrorResponse,
  pushReferralWallet,
} from "@/lib/referral-kasse";
import { recordFirstVisit, ReferralError } from "@/lib/referral";
import { IdempotencyInFlight } from "@/lib/idempotency";
import { apiError } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  referralId: z.string().min(1).max(40),
  idempotencyKey: z.string().max(80).optional(),
});

// "Foerste besoeg gennemfoert": created -> rewarded via tilstandsmaskinen, med
// staff-id fra kassen og kassens idempotency key (dobbelttryk = eet resultat).
export async function POST(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  try {
    const res = await recordFirstVisit({
      referralId: parsed.data.referralId,
      businessId: kasse.businessId,
      staffUserId: kasse.staffUserId,
      staffDeviceId: kasse.staffDeviceId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    // Begge kort (ny kunde + ambassadoer) faar deres nye beloenning i Wallet.
    pushReferralWallet(res.rewards.map((r) => r.cardId));
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
