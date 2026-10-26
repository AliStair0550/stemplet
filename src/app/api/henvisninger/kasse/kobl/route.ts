import type { NextRequest } from "next/server";
import { z } from "zod";
import { referralKasse, noAccess, referralErrorResponse } from "@/lib/referral-kasse";
import { createReferral, ReferralError } from "@/lib/referral";
import { apiError } from "@/lib/http";
import { captureServerError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  referredCardId: z.string().min(1).max(40),
  referrerCardId: z.string().min(1).max(40),
});

// "Henvist af" ved disken: kunden kom uden link, men siger "jeg kommer fra Sara".
// Samme regler som et link: det foerste vinder, ingen selvhenvisning.
export async function POST(req: NextRequest) {
  const kasse = await referralKasse();
  if (!kasse) return noAccess();
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("BAD_REQUEST", "Ugyldig forespørgsel.");
  try {
    const referral = await createReferral({
      businessId: kasse.businessId,
      referrerCardId: parsed.data.referrerCardId,
      referredCardId: parsed.data.referredCardId,
      source: "MANUAL_AT_DESK",
    });
    return Response.json({ ok: true, referralId: referral.id });
  } catch (e) {
    if (e instanceof ReferralError) return referralErrorResponse(e);
    captureServerError(e, { route: "henvisninger/kobl", businessId: kasse.businessId });
    return apiError("SERVER", "Noget gik galt.", 500);
  }
}
