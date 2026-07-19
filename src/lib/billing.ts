import "server-only";
import { after } from "next/server";
import { prisma } from "./prisma";
import { APP_URL } from "./env";
import { DEMO_SLUG } from "./demo";
import { PRO_PRICE_DKK, FREE_CUSTOMER_LIMIT, FREE_CUSTOMER_WARN } from "./plans";
import { sendEmail } from "./send-email";
import { superadminRecipients } from "./superadmin-emails";
import {
  cardholderWarningEmail,
  superadminThresholdEmail,
  superadminInvoiceEmail,
} from "./emails";
import { captureServerError } from "./sentry";

// Prismodel + manuel fakturering (Billy). Ingen automatik lukker noget - kun
// superadmin. Kortholder-definitionen EER kanonisk her og genbruges overalt.

// Injicerbare afhaengigheder, saa taerskel-logikken kan enhedstestes med en
// in-memory DB og en fake mailer (samme moenster som redis-injektionen i tokens/
// security). Produktion bruger altid standardvaerdierne (rigtig prisma + sendEmail),
// saa kaldere er uaendrede og fuldt type-tjekket.
type Db = typeof prisma;
type Mailer = typeof sendEmail;

/** En kortholder = eet CustomerCard for butikken. Samme definition overalt. */
export async function countCardholders(
  businessId: string,
  db: Db = prisma,
): Promise<number> {
  const cards = await db.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);
  if (cardIds.length === 0) return 0;
  return db.customerCard.count({ where: { cardId: { in: cardIds } } });
}

/** Tærskler: varsel ved 80, Pro fra 100. Genbruger de eksisterende konstanter. */
export const CARDHOLDER_WARN = FREE_CUSTOMER_WARN; // 80
export const CARDHOLDER_LIMIT = FREE_CUSTOMER_LIMIT; // 100

/** Effektiv maanedspris i kr. En specialpris (fx founding member) gaelder indtil
 *  proPriceUntil; derefter falder butikken tilbage til standardprisen (99). */
export function effectiveProPriceKr(b: {
  proPriceKr: number;
  proPriceUntil: Date | null;
}): number {
  if (b.proPriceUntil && b.proPriceUntil.getTime() < Date.now()) {
    return PRO_PRICE_DKK;
  }
  return b.proPriceKr;
}

/** Hvorfor et NYT kort afvises, hvis det goer. Kun superadmin saetter disse. */
export function signupBlockReason(b: {
  stopped: boolean;
  newSignupsPaused: boolean;
}): "stoppet" | "pause" | null {
  if (b.stopped) return "stoppet";
  if (b.newSignupsPaused) return "pause";
  return null;
}

function runAfterResponse(task: () => Promise<void>) {
  const run = async () => {
    try {
      await task();
    } catch (err) {
      console.error("Billing-baggrundsopgave fejlede", err);
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

/**
 * Kaldes efter at et NYT kortholder-kort er oprettet. Registrerer (kun EEN gang
 * per butik) 80-taersklen og 100-krydsningen, hver som en atomisk fire-once, og
 * beder saa om at faa den tilhoerende mail sendt. Selve afsendelsen er skilt ud,
 * saa en daglig sweep kan gensende, hvis mailen fejler. Koeres efter svaret.
 */
export async function maybeFireCardholderThresholds(
  businessId: string,
): Promise<void> {
  runAfterResponse(() => processCardholderThresholds(businessId));
}

/**
 * Kernen bag taersklerne, udtrukket fra maybeFire, saa den kan AFVENTES i tests.
 * Registrerer 80/100 hver som en atomisk fire-once (guardet updateMany) og beder
 * kun VINDEREN om at sende mailen. To samtidige krydsninger giver derfor praecis
 * eet varsel: begge kan naa if-tjekket, men kun een vinder updateMany.
 */
export async function processCardholderThresholds(
  businessId: string,
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
): Promise<void> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      cardholderWarnedAt: true,
      reached100At: true,
      cards: { select: { id: true } },
    },
  });
  if (!biz || biz.slug === DEMO_SLUG) return; // demo taeller ikke med
  const cardIds = biz.cards.map((c) => c.id);
  if (cardIds.length === 0) return;
  const count = await db.customerCard.count({
    where: { cardId: { in: cardIds } },
  });

  // 100-krydsning: registrér KENDSGERNINGEN atomisk (fire-once). Vinderen af
  // opdateringen sender faktura-trigger-mailen.
  if (count >= CARDHOLDER_LIMIT && !biz.reached100At) {
    const won = await db.business
      .updateMany({
        where: { id: businessId, reached100At: null },
        data: { reached100At: new Date() },
      })
      .catch(() => ({ count: 0 }));
    if (won.count === 1) await sendInvoiceTriggerEmail(businessId, db, sendMail);
  }

  // 80-varsel: samme atomiske fire-once. Vinderen sender varsel-mailene.
  if (count >= CARDHOLDER_WARN && !biz.cardholderWarnedAt) {
    const won = await db.business
      .updateMany({
        where: { id: businessId, cardholderWarnedAt: null },
        data: { cardholderWarnedAt: new Date() },
      })
      .catch(() => ({ count: 0 }));
    if (won.count === 1) await sendCardholderWarnEmails(businessId, db, sendMail);
  }
}

// Sender een mail og siger tydeligt, om den kom af sted. sendEmail kaster ved en
// Resend-fejl og returnerer false, hvis noeglen mangler; begge dele betyder
// "ikke leveret". Kaster aldrig selv.
async function trySend(
  to: string,
  mail: { subject: string; html: string; text: string },
  sendMail: Mailer,
): Promise<boolean> {
  try {
    return await sendMail({ to, ...mail });
  } catch (e) {
    console.error("Taerskel-mail fejlede til", to, e);
    return false;
  }
}

const dkDateTime = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  dateStyle: "long",
  timeStyle: "short",
});

/**
 * Sender 80-varslet (ejer + superadmin) og saetter cardholderWarnEmailSentAt ved
 * BEKRAEFTET levering. Fejler en mail, fanges det i Sentry, og flaget forbliver
 * null, saa den daglige sweep proever igen. Fire-once-flaget (cardholderWarnedAt)
 * er uroert. Returnerer true, hvis alt kom af sted.
 */
export async function sendCardholderWarnEmails(
  businessId: string,
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
): Promise<boolean> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      name: true,
      proPriceKr: true,
      proPriceUntil: true,
      users: { select: { email: true } },
    },
  });
  if (!biz || biz.slug === DEMO_SLUG) return false;
  const cardholders = await countCardholders(businessId, db);
  const priceKr = effectiveProPriceKr(biz);
  const ownerEmails = biz.users
    .map((u) => u.email)
    .filter((e): e is string => Boolean(e));

  let allOk = true;

  // Til ejeren: venligt varsel + link til godkendelsessiden.
  const ownerMail = cardholderWarningEmail({
    businessName: biz.name,
    cardholders,
    limit: CARDHOLDER_LIMIT,
    priceKr,
    agreementUrl: `${APP_URL}/app/aftale`,
  });
  for (const to of ownerEmails) {
    if (!(await trySend(to, ownerMail, sendMail))) allOk = false;
  }

  // Til superadmin(erne): hvem er paa vej over.
  const recipients = superadminRecipients();
  if (recipients.length > 0) {
    const adminMail = superadminThresholdEmail({
      businessName: biz.name,
      slug: biz.slug,
      cardholders,
      limit: CARDHOLDER_LIMIT,
      ownerEmails: ownerEmails.join(", ") || "(ingen)",
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      if (!(await trySend(to, adminMail, sendMail))) allOk = false;
    }
  }

  if (allOk) {
    await db.business
      .update({
        where: { id: businessId },
        data: { cardholderWarnEmailSentAt: new Date() },
      })
      .catch(() => {});
    return true;
  }
  captureServerError(
    new Error("Kortholder-varsel: en eller flere mails kunne ikke leveres"),
    { route: "billing:cardholder-warn", businessId },
  );
  return false;
}

/**
 * Sender faktura-trigger-mailen til superadmin ved 100-krydsning og saetter
 * reached100EmailSentAt ved BEKRAEFTET levering. Samme sweep-baserede resiliens
 * som 80-varslet. 100-krydsningen ER faktureringstidspunktet, saa mailen samler
 * alt til Billy-fakturaen. Returnerer true, hvis den kom af sted.
 */
export async function sendInvoiceTriggerEmail(
  businessId: string,
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
): Promise<boolean> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      name: true,
      proPriceKr: true,
      proPriceUntil: true,
      proApprovedAt: true,
      users: { select: { email: true } },
    },
  });
  if (!biz || biz.slug === DEMO_SLUG) return false;

  const recipients = superadminRecipients();
  let allOk = true;
  if (recipients.length > 0) {
    const cardholders = await countCardholders(businessId, db);
    const mail = superadminInvoiceEmail({
      businessName: biz.name,
      slug: biz.slug,
      cardholders,
      limit: CARDHOLDER_LIMIT,
      priceKr: effectiveProPriceKr(biz),
      standardPriceKr: PRO_PRICE_DKK,
      approvedLabel: biz.proApprovedAt
        ? dkDateTime.format(biz.proApprovedAt)
        : "Ikke godkendt endnu",
      ownerEmails:
        biz.users
          .map((u) => u.email)
          .filter((e): e is string => Boolean(e))
          .join(", ") || "(ingen)",
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      if (!(await trySend(to, mail, sendMail))) allOk = false;
    }
  }

  if (allOk) {
    await db.business
      .update({
        where: { id: businessId },
        data: { reached100EmailSentAt: new Date() },
      })
      .catch(() => {});
    return true;
  }
  captureServerError(new Error("Faktura-trigger-mail kunne ikke leveres"), {
    route: "billing:invoice-trigger",
    businessId,
  });
  return false;
}

/**
 * Daglig sweep (cron): gensend taerskel-mails, der aldrig blev leveret, saa et
 * Resend-blip eller en servergenstart ikke taber varslet. Finder butikker, hvor
 * taersklen er krydset (Warned/reached100At sat), men mailen endnu ikke bekraeftet
 * leveret (EmailSentAt null). Demo ekskluderet.
 */
export async function sweepPendingThresholdEmails(
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
): Promise<{
  warns: number;
  invoices: number;
}> {
  const [pendingWarns, pendingInvoices] = await Promise.all([
    db.business.findMany({
      where: {
        cardholderWarnedAt: { not: null },
        cardholderWarnEmailSentAt: null,
        slug: { not: DEMO_SLUG },
      },
      select: { id: true },
    }),
    db.business.findMany({
      where: {
        reached100At: { not: null },
        reached100EmailSentAt: null,
        slug: { not: DEMO_SLUG },
      },
      select: { id: true },
    }),
  ]);

  let warns = 0;
  for (const b of pendingWarns) {
    if (await sendCardholderWarnEmails(b.id, db, sendMail)) warns += 1;
  }
  let invoices = 0;
  for (const b of pendingInvoices) {
    if (await sendInvoiceTriggerEmail(b.id, db, sendMail)) invoices += 1;
  }
  return { warns, invoices };
}

// ── Godkendelsesside (ejer-dashboard) ────────────────────────────────

export type AgreementView = {
  cardholders: number;
  warn: number;
  limit: number;
  priceKr: number; // effektiv pris (specialpris eller standard)
  standardPriceKr: number;
  approved: boolean;
  approvedAt: Date | null;
  overLimit: boolean; // har krydset 100
  warned: boolean; // varslet (eller allerede over 80)
};

/** Tilstanden til /app/aftale: foer varsel, efter varsel, efter godkendelse, efter 100. */
export async function getAgreementView(businessId: string): Promise<AgreementView> {
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      cardholderWarnedAt: true,
      proApprovedAt: true,
      proPriceKr: true,
      proPriceUntil: true,
    },
  });
  const cardholders = await countCardholders(businessId);
  return {
    cardholders,
    warn: CARDHOLDER_WARN,
    limit: CARDHOLDER_LIMIT,
    priceKr: biz ? effectiveProPriceKr(biz) : PRO_PRICE_DKK,
    standardPriceKr: PRO_PRICE_DKK,
    approved: Boolean(biz?.proApprovedAt),
    approvedAt: biz?.proApprovedAt ?? null,
    overLimit: cardholders >= CARDHOLDER_LIMIT,
    warned: Boolean(biz?.cardholderWarnedAt) || cardholders >= CARDHOLDER_WARN,
  };
}
