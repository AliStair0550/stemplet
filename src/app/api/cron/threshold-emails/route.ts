import type { NextRequest } from "next/server";
import {
  sweepPendingThresholdEmails,
  checkStampInvariant,
} from "@/lib/billing";
import { redisKeepAlive } from "@/lib/redis";
import { checkWalletCertExpiry } from "@/lib/wallet/cert-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Daglig cron (Hobby: kun to crons, saa vi samler opgaverne her):
//  1) Sweep: gensend taerskel-mails (80-varsel / 100-faktura-trigger), der aldrig
//     blev leveret, saa et Resend-blip eller en servergenstart ikke taber varslet.
//     Idempotent: kun butikker hvor mailen endnu ikke er bekraeftet leveret.
//  2) Invariant-check: opdag kort hvor lifetimeStamps != sum(Stamp.multiplier)
//     og rapportér til Sentry (data-drift-vagt).
//  3) Redis keep-alive: eet let touch, saa den gratis Upstash-DB ikke arkiveres
//     for inaktivitet (vores Redis-stier har lav trafik i opstarten).
//  4) Wallet-certifikater: varsler i god tid (mail + Sentry) inden Pass Type ID-
//     eller WWDR-certifikatet udloeber, saa pas-signeringen ikke pludselig doer.
// Beskyttet med CRON_SECRET som de oevrige cron-ruter.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const [emails, invariant, keepalive, certs] = await Promise.all([
    sweepPendingThresholdEmails(),
    checkStampInvariant(),
    redisKeepAlive(),
    checkWalletCertExpiry(),
  ]);
  return Response.json({ ...emails, ...invariant, ...keepalive, ...certs });
}
