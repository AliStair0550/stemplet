import "server-only";
import { prisma } from "./prisma";

/**
 * DB-backet rate limit (fail-closed): virker ogsaa hvis Redis er nede, saa
 * fx magic-link-afsendelse aldrig kan email-bombes under et Redis-nedbrud.
 * Simpelt fast-vindue: taelleren nulstilles, naar vinduet er udloebet.
 * Returnerer true hvis handlingen er tilladt, false hvis graensen er naaet.
 */
export async function durableRateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = Date.now();
  const cutoff = new Date(now - windowSeconds * 1000);

  // Nulstil udloebne vinduer, saa taelleren starter forfra i det nye vindue.
  await prisma.sendThrottle.updateMany({
    where: { scope, key, windowStart: { lt: cutoff } },
    data: { count: 0, windowStart: new Date(now) },
  });

  // Atomisk optaelling; opretter raekken hvis den ikke findes.
  const row = await prisma.sendThrottle.upsert({
    where: { scope_key: { scope, key } },
    create: { scope, key, count: 1, windowStart: new Date(now) },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  return row.count <= limit;
}
