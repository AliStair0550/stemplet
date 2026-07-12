import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { getBusinessStats } from "@/lib/stats";
import { apiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/stats - butikkens noegletal (samme data som dashboardet).
export async function GET(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  if (!(await checkRateLimit("api-v1-read", 300, "1 m", business.id))) {
    return apiError("RATE_LIMIT", "For mange kald. Prøv igen om lidt.", 429);
  }

  const stats = await getBusinessStats(business.id);
  return Response.json(stats);
}
