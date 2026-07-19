import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { WALLET_ENABLED, APP_URL } from "@/lib/env";
import { resolveOrCreateCard } from "@/lib/claim";
import { loadCCForWallet, buildPkpass } from "@/lib/wallet/build";
import { maybeFireCardholderThresholds } from "@/lib/billing";
import { cardCookieName, cardCookieOptions } from "@/lib/cookies";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureWalletError } from "@/lib/sentry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "Hent mit stempelkort": opretter (eller genfinder) kundens kort og AABNER Apple
// Wallet DIREKTE ved at returnere .pkpass'et i samme svar (paa iPhone). Fordi det
// er kundens eget tryk paa et rigtigt link, aabner Safari Wallet-arket uden
// skroebelig JavaScript-navigation (som crashede med "Prøv igen"). Android/desktop
// har ingen Apple Wallet og sendes til webkortet med QR.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const back = (path: string) => NextResponse.redirect(new URL(path, APP_URL));

  // Let, generoes rate-limit pr. IP, saa ruten ikke kan misbruges til at oprette
  // kort en masse. 60/time rammer ikke normal butikstrafik (kunder henter EEN
  // gang), men stopper en loebsk bot.
  const ip =
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "ukendt";
  const allowed = await durableRateLimit("claim-ip", ip, 60, 3600).catch(
    () => true,
  );
  if (!allowed) return back(`/k/${slug}?fejl=fuld`);

  const r = await resolveOrCreateCard(slug);
  if (!r.ok) return back(`/k/${slug}?fejl=${r.error}`);

  // Kun ved et NYT kort kan en taerskel (80/100) vaere krydset.
  if (r.created) await maybeFireCardholderThresholds(r.businessId);

  // Device-cookien saettes paa svaret (mest paalidelige maade i en route-handler).
  const withCookie = (res: NextResponse) => {
    res.cookies.set(cardCookieName(r.businessId), r.authToken, cardCookieOptions());
    return res;
  };

  const ua = (await headers()).get("user-agent") ?? "";
  const ios = /iPhone|iPad|iPod/i.test(ua);

  // Ingen Apple Wallet (Android/desktop, eller wallet slaaet fra): vis webkortet.
  if (!ios || !WALLET_ENABLED) {
    return withCookie(back(`/kort/${r.serial}`));
  }

  // iPhone: byg passet og RETURNER det direkte, saa Wallet-arket aabner fra selve
  // trykket. Fejler bygningen, falder vi pænt tilbage til webkortet.
  const cc = await loadCCForWallet(r.serial);
  if (!cc) return withCookie(back(`/kort/${r.serial}`));

  let buffer: Buffer;
  try {
    buffer = await buildPkpass(cc);
  } catch (e) {
    captureWalletError(e, {
      operation: "buildPkpass:claim",
      businessId: r.businessId,
      serial: r.serial,
    });
    return withCookie(back(`/kort/${r.serial}`));
  }

  const res = new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      // "inline", IKKE "attachment": iOS Safari skal AABNE passet i Wallet.
      "content-disposition": `inline; filename="stemplet-${r.serial}.pkpass"`,
      "cache-control": "no-store",
    },
  });
  return withCookie(res);
}
