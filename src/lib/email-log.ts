import "server-only";
import { prisma } from "./prisma";

type Db = typeof prisma;

// En koersel, der doede midt i en afsendelse, efterlader en raekke uden sentAt.
// Efter dette tidsrum maa en ny koersel tage den.
const STALE_CLAIM_MS = 10 * 60 * 1000;

export type SendOnceResult = "sent" | "skipped" | "failed";

/**
 * Send en mail hoejst een gang pr. (butik, slags, modtager). "skipped" = den er
 * allerede sendt, eller en anden koersel er i gang med den lige nu. Fejler
 * afsendelsen, fjernes raekken, saa naeste koersel proever igen.
 */
export async function sendOnce(
  key: { businessId: string; kind: string; recipient: string },
  send: () => Promise<boolean>,
  db: Db = prisma,
  now: Date = new Date(),
): Promise<SendOnceResult> {
  const where = { businessId_kind_recipient: { ...key, recipient: key.recipient.toLowerCase() } };
  const data = { ...key, recipient: key.recipient.toLowerCase() };
  let claimedId: string;
  try {
    claimedId = (await db.emailLog.create({ data, select: { id: true } })).id;
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e;
    const existing = await db.emailLog.findUnique({ where, select: { id: true, sentAt: true, createdAt: true } });
    if (!existing || existing.sentAt) return "skipped";
    // En gammel, ufaerdig raekke: tag den, men kun hvis ingen anden lige har.
    const retaken = await db.emailLog.updateMany({
      where: { id: existing.id, sentAt: null, createdAt: { lt: new Date(now.getTime() - STALE_CLAIM_MS) } },
      data: { createdAt: now },
    });
    if (retaken.count !== 1) return "skipped";
    claimedId = existing.id;
  }

  let ok = false;
  try {
    ok = await send();
  } catch {
    ok = false;
  }
  if (ok) {
    await db.emailLog.update({ where: { id: claimedId }, data: { sentAt: new Date() } }).catch(() => {});
    return "sent";
  }
  await db.emailLog.delete({ where: { id: claimedId } }).catch(() => {});
  return "failed";
}
