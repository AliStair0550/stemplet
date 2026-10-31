import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { APP_URL } from "@/lib/env";
import { redeemCardRecovery } from "@/lib/card-recovery";
import { cardCookieName, cardCookieOptions, DEVICE_ID_COOKIE, deviceCookieOptions } from "@/lib/cookies";
import { newDeviceId } from "@/lib/ids";
import { captureServerError } from "@/lib/sentry";
import { isCrossSite } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Indloes et gendannelseslink. Kun POST (knappen "Gendan mit kort" paa
// /k/[slug]/gendan): mail-programmers link-scannere aabner links med GET og
// ville ellers bruge linket op, foer kunden naar at trykke.
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (isCrossSite(req)) return NextResponse.redirect(new URL(`/k/${slug}`, APP_URL), 303);
  const form = await req.formData().catch(() => null);
  const token = String(form?.get("t") ?? "");
  const go = (path: string) => NextResponse.redirect(new URL(path, APP_URL), 303);

  const existingDid = (await cookies()).get(DEVICE_ID_COOKIE)?.value;
  const deviceId = existingDid ?? newDeviceId();

  let r;
  try {
    r = await redeemCardRecovery(token, slug, deviceId);
  } catch (e) {
    captureServerError(e, { route: "wallet:claim:gendan:indloes", extra: { slug } });
    return go(`/k/${slug}?fejl=serverfejl`);
  }
  if (!r) return go(`/k/${slug}/gendan?udloebet=1`);

  // Uden stempler er kundens side henvisningssiden; ellers stempelkortets side,
  // som nu genkender kortet og viser "Tilføj til Apple Wallet".
  const res = go(`/k/${slug}?gendannet=1`);
  res.cookies.set(cardCookieName(r.businessId), r.authToken, cardCookieOptions());
  if (!existingDid) res.cookies.set(DEVICE_ID_COOKIE, deviceId, deviceCookieOptions());
  return res;
}
