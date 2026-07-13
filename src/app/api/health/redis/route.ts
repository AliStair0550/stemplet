import type { NextRequest } from "next/server";
import { redisConfigured, getRedis } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MIDLERTIDIGT: beskyttet health-check der faar PRODUKTIONEN selv til at lave en
// Redis round-trip, saa vi kan bekraefte at Upstash er wired korrekt i prod.
// Beskyttet med CRON_SECRET. Fjernes igen efter verifikation.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!redisConfigured()) {
    return Response.json({ configured: false, roundtrip: false });
  }

  try {
    const redis = getRedis();
    const key = "healthcheck:redis";
    await redis.set(key, "ok", { ex: 30 });
    const val = await redis.get(key);
    await redis.del(key);
    return Response.json({ configured: true, roundtrip: val === "ok" });
  } catch (e) {
    return Response.json(
      { configured: true, roundtrip: false, error: String(e).slice(0, 200) },
      { status: 500 },
    );
  }
}
