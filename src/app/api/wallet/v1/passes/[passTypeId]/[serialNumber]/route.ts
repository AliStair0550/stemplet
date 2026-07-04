import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { loadCCForWallet, buildPkpass, checkPassAuth } from "@/lib/wallet/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hent det opdaterede pass (Apple henter det efter en push).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ passTypeId: string; serialNumber: string }> },
) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  const { serialNumber } = await params;

  const cc = await loadCCForWallet(serialNumber);
  if (!cc || !checkPassAuth(req.headers.get("authorization"), cc.authToken)) {
    return new Response(null, { status: 401 });
  }

  const buffer = await buildPkpass(cc);
  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "last-modified": new Date().toUTCString(),
    },
  });
}
