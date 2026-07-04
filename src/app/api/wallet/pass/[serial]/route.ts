import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { loadCCForWallet, buildPkpass } from "@/lib/wallet/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Download af .pkpass fra webkortet ("Læg i Apple Wallet").
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ serial: string }> },
) {
  if (!WALLET_ENABLED) return new Response("Wallet er ikke aktiveret.", { status: 404 });
  const { serial } = await params;

  const cc = await loadCCForWallet(serial);
  if (!cc) return new Response("Kortet blev ikke fundet.", { status: 404 });

  const buffer = await buildPkpass(cc);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "content-disposition": `attachment; filename="${serial}.pkpass"`,
    },
  });
}
