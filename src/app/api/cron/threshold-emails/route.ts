import type { NextRequest } from "next/server";
import { sweepPendingThresholdEmails } from "@/lib/billing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daglig sweep: gensend taerskel-mails (80-varsel og 100-faktura-trigger), der
// aldrig blev leveret, saa et Resend-blip eller en servergenstart ikke taber
// varslet. Idempotent: kun butikker hvor mailen endnu ikke er bekraeftet leveret
// (EmailSentAt null) roeres. Beskyttet med CRON_SECRET som de oevrige cron-ruter.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const result = await sweepPendingThresholdEmails();
  return Response.json(result);
}
