import type { NextRequest } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { durableRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";

export const runtime = "nodejs";

const MAX_BODY = 10_000;

// Apple sender fejl-logs hertil. Vi kvitterer altid. Adressen er offentlig, saa
// logningen har loft pr. IP og en maksimal stoerrelse (ingen log-oversvoemmelse).
export async function POST(req: NextRequest) {
  if (!WALLET_ENABLED) return new Response(null, { status: 404 });
  try {
    if (!(await durableRateLimit("wallet-log", clientIp(req) ?? "ukendt", 60, 3600))) {
      return new Response(null, { status: 200 });
    }
    const raw = (await req.text()).slice(0, MAX_BODY);
    const body = JSON.parse(raw) as { logs?: unknown };
    if (Array.isArray(body?.logs) && body.logs.length) {
      const lines = body.logs.slice(0, 20).map((l) => String(l).replace(/[\r\n]+/g, " ").slice(0, 500));
      console.log("[wallet-log]", lines.join(" | "));
    }
  } catch {
    // ignorer
  }
  return new Response(null, { status: 200 });
}
