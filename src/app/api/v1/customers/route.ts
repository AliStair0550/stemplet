import type { NextRequest } from "next/server";
import { businessByApiKey } from "@/lib/integrations";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/http";
import { checkRateLimit } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/customers?limit=200 - liste over alle kort i butikken (til sync).
export async function GET(req: NextRequest) {
  const business = await businessByApiKey(req.headers.get("authorization"));
  if (!business) return apiError("UNAUTHORIZED", "Ugyldig API-nøgle.", 401);

  if (!(await checkRateLimit("api-v1-read", 300, "1 m", business.id))) {
    return apiError("RATE_LIMIT", "For mange kald. Prøv igen om lidt.", 429);
  }

  const limit = Math.min(
    500,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 200),
  );

  const cards = await prisma.card.findMany({
    where: { businessId: business.id },
    select: { id: true, stampsRequired: true },
  });
  const requiredByCard = new Map(cards.map((c) => [c.id, c.stampsRequired]));

  const ccs = await prisma.customerCard.findMany({
    where: { cardId: { in: cards.map((c) => c.id) } },
    select: {
      serial: true,
      cardId: true,
      stamps: true,
      completedCount: true,
      contactEmail: true,
      createdAt: true,
      lastStampAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return Response.json({
    count: ccs.length,
    limit,
    customers: ccs.map((c) => {
      const required = requiredByCard.get(c.cardId) ?? null;
      return {
        serial: c.serial,
        stamps: c.stamps,
        required,
        rewardReady: required != null && c.stamps >= required,
        completedCount: c.completedCount,
        contactEmail: c.contactEmail,
        createdAt: c.createdAt,
        lastStampAt: c.lastStampAt,
      };
    }),
  });
}
