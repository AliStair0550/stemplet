import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { getBusinessStats } from "@/lib/stats";
import { apiError } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/stats - butikkens noegletal (samme data som dashboardet).
export async function GET(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  const stats = await getBusinessStats(business.id);
  return Response.json(stats);
}
