import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { pushAllWalletPasses } from "@/lib/wallet/build";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Manuel udrulning: pusher en pass-opdatering til ALLE kort, der allerede ligger
// i Wallet, saa en struktur-aendring (header/farver) naar eksisterende kort uden
// at vente paa en stempling. Beskyttet med CRON_SECRET (kun superadmin kan koere
// den). POST, fordi den udloeser en bunke pushes.
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!WALLET_ENABLED) {
    return Response.json({ skipped: "wallet slaaet fra" });
  }
  const result = await pushAllWalletPasses();
  return Response.json(result);
}
