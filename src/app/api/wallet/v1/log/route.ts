import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";

export const runtime = "nodejs";

// Apple sender fejl-logs hertil. Vi kvitterer.
export async function POST(req: NextRequest) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  try {
    const body = await req.json();
    if (Array.isArray(body?.logs) && body.logs.length) {
      console.log("[wallet-log]", body.logs.join(" | "));
    }
  } catch {
    // ignorer
  }
  return new Response(null, { status: 200 });
}
