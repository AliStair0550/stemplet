import "server-only";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

let _redis: Redis | null = null;

/** Er Upstash konfigureret? Bruges til at "fail-open" i dev uden Redis. */
export function redisConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

/** Upstash Redis-singleton. Kaster først hvis den bruges uden konfiguration. */
export function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Upstash Redis er ikke konfigureret. Sæt UPSTASH_REDIS_REST_URL og UPSTASH_REDIS_REST_TOKEN.",
    );
  }
  _redis = new Redis({ url, token });
  return _redis;
}

const _limiters = new Map<string, Ratelimit>();

/** Memoiseret rate limiter (sliding window). */
export function getRatelimit(
  prefix: string,
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
): Ratelimit {
  const key = `${prefix}:${tokens}:${window}`;
  const existing = _limiters.get(key);
  if (existing) return existing;
  const rl = new Ratelimit({
    redis: getRedis(),
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix,
    analytics: false,
  });
  _limiters.set(key, rl);
  return rl;
}

/**
 * Rate limit-tjek der aldrig vaelter flowet. Returnerer true (tilladt) hvis
 * Redis ikke er sat op eller fejler - saa en Redis-hikke aldrig laaser
 * legitime brugere ude. Returnerer false naar graensen faktisk er naaet.
 */
export async function checkRateLimit(
  prefix: string,
  tokens: number,
  window: Parameters<typeof Ratelimit.slidingWindow>[1],
  id: string,
): Promise<boolean> {
  if (!redisConfigured()) return true;
  try {
    const { success } = await getRatelimit(prefix, tokens, window).limit(id);
    return success;
  } catch {
    return true;
  }
}

/**
 * Let "keep-alive"-touch af Upstash, saa en gratis-plan-database ikke bliver
 * arkiveret for inaktivitet. Vores Redis-stier (idempotens, API-rate-limit) har
 * lav trafik i den tidlige fase, saa det daglige cron sender eet let touch.
 * Ingen effekt hvis Redis ikke er konfigureret, og fejler stille, saa det aldrig
 * braekker cron-jobbet.
 */
export async function redisKeepAlive(): Promise<{
  redisKeepAlive: "ok" | "skipped" | "error";
}> {
  if (!redisConfigured()) return { redisKeepAlive: "skipped" };
  try {
    const redis = getRedis();
    // TTL paa 2 doegn: noeglen overlever mellem daglige pings og rydder sig selv.
    await redis.set("keepalive:ping", new Date().toISOString(), { ex: 172_800 });
    await redis.get("keepalive:ping");
    return { redisKeepAlive: "ok" };
  } catch {
    return { redisKeepAlive: "error" };
  }
}
