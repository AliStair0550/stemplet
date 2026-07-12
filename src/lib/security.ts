import "server-only";
import bcrypt from "bcryptjs";
import { getRedis } from "./redis";
import { prisma } from "./prisma";
import { PIN_MAX_ATTEMPTS, PIN_LOCK_SECONDS } from "./system-config";

// ── Personale-PIN ─────────────────────────────────────────────────────

export async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

// ── PIN-forsøg og låsning ──────────────────────────────────────────
// 3 fejlforsøg låser indløsning i 5 minutter. DB-backet (ikke kun Redis), saa
// laasningen ALDRIG kan omgaas ved et Redis-nedbrud. lockId er IP (eller
// enheds-id). Den atomiske INCREMENT taeller korrekt selv ved mange samtidige
// forsoeg (bruteforce).

export async function pinLockRemaining(
  businessId: string,
  lockId: string,
): Promise<number> {
  const row = await prisma.pinAttempt.findUnique({
    where: { businessId_lockId: { businessId, lockId } },
    select: { lockedUntil: true },
  });
  if (!row?.lockedUntil) return 0;
  const ms = row.lockedUntil.getTime() - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

export async function recordPinFail(
  businessId: string,
  lockId: string,
): Promise<{ locked: boolean }> {
  const row = await prisma.pinAttempt.upsert({
    where: { businessId_lockId: { businessId, lockId } },
    create: { businessId, lockId, fails: 1 },
    update: { fails: { increment: 1 } },
    select: { fails: true },
  });
  if (row.fails >= PIN_MAX_ATTEMPTS) {
    await prisma.pinAttempt.update({
      where: { businessId_lockId: { businessId, lockId } },
      data: { fails: 0, lockedUntil: new Date(Date.now() + PIN_LOCK_SECONDS * 1000) },
    });
    return { locked: true };
  }
  return { locked: false };
}

export async function clearPinFails(
  businessId: string,
  lockId: string,
): Promise<void> {
  await prisma.pinAttempt.deleteMany({ where: { businessId, lockId } });
}

// ── Anomali-flag ──────────────────────────────────────────────────────
// Café-gæstewifi deler EEN offentlig IP, saa rene volumen-spikes fra én IP mod
// én butik er IKKE mistænkelige (en travl fredag ligner det). Vi flager derfor:
//   1) KORT-niveau: samme kundekort faar unormalt mange stempler paa en time.
//   2) IP-niveau: KUN naar samme IP rammer mange FORSKELLIGE kort OG flere
//      FORSKELLIGE butikker (det moenster er reelt scriptet misbrug).
// En enkelt café (mange kort, samme IP, samme butik) flager aldrig.

const ANOM_WINDOW = 60 * 60; // 1 time
const CARD_STAMP_LIMIT = 15; // ét kort bør ikke faa saa mange stempler paa en time
const IP_DISTINCT_CARDS = 10; // mange forskellige kort fra samme IP ...
const IP_DISTINCT_BIZ = 3; // ... OG paa tvaers af flere butikker

// Minimalt Redis-interface, saa detektionen kan testes med en fake.
type AnomalyStore = {
  incr: (key: string) => Promise<number>;
  expire: (key: string, seconds: number) => Promise<unknown>;
  sadd: (key: string, member: string) => Promise<unknown>;
  scard: (key: string) => Promise<number>;
};

export type AnomalyResult = {
  flagged: boolean;
  reason: "card-volume" | "ip-cross-business" | null;
};

export async function trackStampAnomaly(
  input: { businessId: string; customerCardId: string; ip: string | null },
  store?: AnomalyStore,
): Promise<AnomalyResult> {
  const redis = store ?? (getRedis() as unknown as AnomalyStore);

  // 1) Samme kort, unormalt mange stempler paa en time.
  const cardKey = `anomcard:${input.customerCardId}`;
  const cardCount = await redis.incr(cardKey);
  if (cardCount === 1) await redis.expire(cardKey, ANOM_WINDOW);
  if (cardCount > CARD_STAMP_LIMIT) {
    return { flagged: true, reason: "card-volume" };
  }

  // 2) Samme IP paa tvaers af mange kort OG flere butikker. En enkelt butik
  //    giver distinctBiz = 1, saa café-volumen mod én butik flager aldrig.
  if (input.ip) {
    const cardsKey = `anomip:cards:${input.ip}`;
    const bizKey = `anomip:biz:${input.ip}`;
    await redis.sadd(cardsKey, input.customerCardId);
    await redis.expire(cardsKey, ANOM_WINDOW);
    await redis.sadd(bizKey, input.businessId);
    await redis.expire(bizKey, ANOM_WINDOW);
    const distinctCards = await redis.scard(cardsKey);
    const distinctBiz = await redis.scard(bizKey);
    if (distinctCards > IP_DISTINCT_CARDS && distinctBiz > IP_DISTINCT_BIZ) {
      return { flagged: true, reason: "ip-cross-business" };
    }
  }

  return { flagged: false, reason: null };
}
