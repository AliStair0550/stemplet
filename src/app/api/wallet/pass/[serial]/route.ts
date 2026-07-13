import type { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { WALLET_ENABLED } from "@/lib/env";
import { loadCCForWallet, buildPkpass } from "@/lib/wallet/build";
import { getCardToken } from "@/lib/cookies";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function tokenMatches(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// Download af .pkpass fra webkortet ("Læg i Apple Wallet").
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ serial: string }> },
) {
  if (!WALLET_ENABLED) return new Response("Wallet er ikke aktiveret.", { status: 404 });
  const { serial } = await params;

  const cc = await loadCCForWallet(serial);
  if (!cc) return new Response("Kortet blev ikke fundet.", { status: 404 });

  // Ejerskabs-tjek: passet indeholder kortets hemmelige authToken, saa kun den
  // enhed kortet er bundet til (device-cookien) maa hente det. Ellers kunne
  // enhver der kender det offentlige serienr. hente passet, udtraekke authToken
  // og afregistrere offerets Wallet-enhed. Apples egne pass-opdateringer gaar
  // via web-servicen (ApplePass-token), ikke dette endpoint, og paavirkes ikke.
  const cookieToken = await getCardToken(cc.card.businessId);
  if (!tokenMatches(cookieToken, cc.authToken)) {
    return new Response("Kortet blev ikke fundet.", { status: 404 });
  }

  const buffer = await buildPkpass(cc);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "content-disposition": `attachment; filename="${serial}.pkpass"`,
    },
  });
}
