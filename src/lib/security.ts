import "server-only";
import bcrypt from "bcryptjs";
import { getRedis } from "./redis";

// ── Personale-PIN ─────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ── PIN-forsøg og låsning pr. enhed ────────────────────────────────
// 3 fejlforsøg låser indløsning i 5 minutter for den enhed.

const PIN_MAX_FAILS = 3;
const PIN_LOCK_SECONDS = 5 * 60;

function failKey(businessId: string, deviceId: string) {
  return `pinfail:${businessId}:${deviceId}`;
}
function lockKey(businessId: string, deviceId: string) {
  return `pinlock:${businessId}:${deviceId}`;
}

export async function pinLockRemaining(
  businessId: string,
  deviceId: string,
): Promise<number> {
  const redis = getRedis();
  const ttl = await redis.ttl(lockKey(businessId, deviceId));
  return ttl > 0 ? ttl : 0;
}

export async function recordPinFail(
  businessId: string,
  deviceId: string,
): Promise<{ locked: boolean; remaining: number; fails: number }> {
  const redis = getRedis();
  const key = failKey(businessId, deviceId);
  const fails = await redis.incr(key);
  if (fails === 1) {
    await redis.expire(key, PIN_LOCK_SECONDS);
  }
  if (fails >= PIN_MAX_FAILS) {
    await redis.set(lockKey(businessId, deviceId), "1", {
      ex: PIN_LOCK_SECONDS,
    });
    await redis.del(key);
    return { locked: true, remaining: PIN_LOCK_SECONDS, fails };
  }
  return { locked: false, remaining: 0, fails };
}

export async function clearPinFails(
  businessId: string,
  deviceId: string,
): Promise<void> {
  const redis = getRedis();
  await redis.del(failKey(businessId, deviceId));
  await redis.del(lockKey(businessId, deviceId));
}

// ── Anomali-flag ──────────────────────────────────────────────────────
// Mere end 5 stempler fra samme IP på tværs af kort inden for en time.

const IP_STAMP_WINDOW = 60 * 60;
const IP_STAMP_THRESHOLD = 5;

export async function trackIpStamp(
  ip: string | null,
): Promise<{ count: number; flagged: boolean }> {
  if (!ip) return { count: 0, flagged: false };
  const redis = getRedis();
  const key = `ipstamp:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, IP_STAMP_WINDOW);
  }
  return { count, flagged: count > IP_STAMP_THRESHOLD };
}
