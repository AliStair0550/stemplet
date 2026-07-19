import type { NextRequest } from "next/server";
import {
  sweepPendingThresholdEmails,
  checkStampInvariant,
} from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daglig cron (Hobby: kun to crons, saa vi samler to opgaver her):
//  1) Sweep: gensend taerskel-mails (80-varsel / 100-faktura-trigger), der aldrig
//     blev leveret, saa et Resend-blip eller en servergenstart ikke taber varslet.
//     Idempotent: kun butikker hvor mailen endnu ikke er bekraeftet leveret.
//  2) Invariant-check: opdag kort hvor lifetimeStamps != sum(Stamp.multiplier)
//     og rapportér til Sentry (data-drift-vagt).
// Beskyttet med CRON_SECRET som de oevrige cron-ruter.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const [emails, invariant] = await Promise.all([
    sweepPendingThresholdEmails(),
    checkStampInvariant(),
  ]);
  return Response.json({ ...emails, ...invariant });
}
