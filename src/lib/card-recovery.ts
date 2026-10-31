import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { normalizeEmail } from "./contact";
import { cardTitle } from "./brand";
import { cardRecoveryEmail } from "./emails";
import { sendEmail } from "./send-email";

// Gendan kortet med e-mail. Kunden skriver sin e-mail; findes et kort med den
// e-mail i butikken, sender vi et link, der virker een gang og i 30 minutter.
// Kun den, der kan aabne mailen, faar kortet (e-mailen er saaledes bekraeftet).
// Svaret til kunden er altid det samme, saa siden aldrig afsloerer, om en
// e-mail har et kort hos butikken.

type Db = typeof prisma;
type Mailer = typeof sendEmail;

export const RECOVERY_TTL_MS = 30 * 60 * 1000;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Send et gendannelseslink, hvis e-mailen har et kort hos butikken. Returnerer
 * om en mail blev sendt (kun til tests og logning, aldrig til kunden).
 */
export async function requestCardRecovery(
  input: { slug: string; email: string; baseUrl: string },
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
): Promise<boolean> {
  const email = normalizeEmail(input.email);
  if (!email) return false;
  const business = await db.business.findUnique({
    where: { slug: input.slug },
    select: { id: true, slug: true, name: true, displayName: true },
  });
  if (!business) return false;
  const cc = await db.customerCard.findFirst({
    where: { businessId: business.id, contactEmail: email },
    select: { id: true },
  });
  if (!cc) return false;

  const token = randomBytes(32).toString("base64url");
  await db.cardRecoveryToken.create({
    data: { tokenHash: hash(token), customerCardId: cc.id, expiresAt: new Date(Date.now() + RECOVERY_TTL_MS) },
  });
  const shopName = cardTitle(business);
  const url = `${input.baseUrl}/k/${business.slug}/gendan?t=${token}`;
  const mail = cardRecoveryEmail(shopName, url);
  return sendMail({ to: email, ...mail, fromName: shopName });
}

export type RecoveredCard = {
  id: string;
  serial: string;
  authToken: string;
  businessId: string;
  slug: string;
  stampsEnabled: boolean;
};

/**
 * Indloes et link: gyldigt, ubrugt og ikke udloebet. Markeres brugt atomisk,
 * saa samme link aldrig virker to gange. Enheden knyttes til kortet, saa det
 * ogsaa genfindes, hvis kort-cookien senere tabes. null = ugyldigt link.
 */
const RECENT_USE_MS = 2 * 60 * 1000;

export async function redeemCardRecovery(
  token: string,
  slug: string,
  deviceId: string | null,
  db: Db = prisma,
): Promise<RecoveredCard | null> {
  if (!token || token.length > 200) return null;
  const row = await db.cardRecoveryToken.findUnique({
    where: { tokenHash: hash(token) },
    select: {
      id: true,
      usedAt: true,
      customerCard: {
        select: {
          id: true,
          cardId: true,
          serial: true,
          authToken: true,
          card: { select: { business: { select: { id: true, slug: true, stampsEnabled: true } } } },
        },
      },
    },
  });
  if (!row) return null;
  const business = row.customerCard.card.business;
  // Linket hoerer til een butik: et link til en anden butiks side virker ikke.
  if (business.slug !== slug) return null;

  const used = await db.cardRecoveryToken.updateMany({
    where: { id: row.id, usedAt: null, expiresAt: { gt: new Date() } },
    data: { usedAt: new Date() },
  });
  if (used.count !== 1) {
    // Dobbelttryk eller genforsoeg efter et tabt svar: linket er netop brugt.
    // Giv kortet igen i stedet for "linket er udloebet", men kun i to minutter.
    // Kun den samme telefon, der fik kortet: et videresendt link kan ikke bruges
    // fra en anden telefon.
    const again = await db.cardRecoveryToken.findUnique({
      where: { id: row.id },
      select: { usedAt: true, customerCard: { select: { deviceId: true } } },
    });
    const usedAt = again?.usedAt ?? row.usedAt;
    const samePhone = !!deviceId && again?.customerCard.deviceId === deviceId;
    if (!usedAt || !samePhone || Date.now() - usedAt.getTime() > RECENT_USE_MS) return null;
  }

  if (deviceId) {
    // Een enhed = eet kort pr. butik: havde telefonen allerede et andet kort
    // her, slippes det (kortet findes stadig), og det gendannede kort vinder.
    const { cardId } = row.customerCard;
    await db.$transaction([
      db.customerCard.updateMany({
        where: { cardId, deviceId, NOT: { id: row.customerCard.id } },
        data: { deviceId: null },
      }),
      db.customerCard.update({ where: { id: row.customerCard.id }, data: { deviceId } }),
    ]);
  }
  return {
    id: row.customerCard.id,
    serial: row.customerCard.serial,
    authToken: row.customerCard.authToken,
    businessId: business.id,
    slug: business.slug,
    stampsEnabled: business.stampsEnabled,
  };
}

/** Er linket stadig gyldigt? Bruges til at vise siden foer kunden trykker. */
export async function recoveryTokenValid(token: string, slug: string, db: Db = prisma): Promise<boolean> {
  if (!token || token.length > 200) return false;
  const row = await db.cardRecoveryToken.findUnique({
    where: { tokenHash: hash(token) },
    select: { usedAt: true, expiresAt: true, customerCard: { select: { card: { select: { business: { select: { slug: true } } } } } } },
  });
  return !!row && !row.usedAt && row.expiresAt > new Date() && row.customerCard.card.business.slug === slug;
}
