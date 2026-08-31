import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { WALLET_ENABLED, APP_URL } from "@/lib/env";
import { loadCCForWallet, buildPkpass } from "@/lib/wallet/build";
import { getCardToken } from "@/lib/cookies";
import { captureWalletError } from "@/lib/sentry";

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
  const { serial } = await params;
  // Trykket er en fuld <a>-navigation, saa ved fejl sender vi kunden til
  // webkortet (/kort/serial) i stedet for en bar tekstside. Webkortet virker
  // uden cookie og uden wallet-cert og har QR'en, personalet kan scanne.
  const toCard = () =>
    NextResponse.redirect(new URL(`/kort/${serial}`, APP_URL));

  if (!WALLET_ENABLED) return toCard();

  const cc = await loadCCForWallet(serial);
  if (!cc) return toCard();

  // Ejerskabs-tjek: passet indeholder kortets hemmelige authToken, saa kun den
  // enhed kortet er bundet til (device-cookien) maa hente det. Ellers kunne
  // enhver der kender det offentlige serienr. hente passet, udtraekke authToken
  // og afregistrere offerets Wallet-enhed. Apples egne pass-opdateringer gaar
  // via web-servicen (ApplePass-token), ikke dette endpoint, og paavirkes ikke.
  const cookieToken = await getCardToken(cc.card.businessId);
  if (!tokenMatches(cookieToken, cc.authToken)) {
    return toCard();
  }

  let buffer: Buffer;
  try {
    buffer = await buildPkpass(cc);
  } catch (e) {
    captureWalletError(e, {
      operation: "buildPkpass:download",
      businessId: cc.card.businessId,
      serial,
    });
    console.error("pkpass-bygning fejlede", e);
    return toCard();
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      // "inline", IKKE "attachment": iOS Safari skal AABNE passet i Wallet.
      // Med attachment forsoeger Safari at downloade det som en fil og siger
      // "Safari kan ikke hente dette arkiv".
      "content-disposition": `inline; filename="stemplet-${serial}.pkpass"`,
      "cache-control": "no-store",
    },
  });
}
