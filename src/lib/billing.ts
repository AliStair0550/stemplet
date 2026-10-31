import "server-only";
import { after } from "next/server";
import { prisma } from "./prisma";
import { APP_URL } from "./env";
import { DEMO_SLUG } from "./demo";
import { PRO_PRICE_DKK, TRIAL_MONTHS, TRIAL_WARN_DAYS, trialEndsAt } from "./plans";
import { sendEmail } from "./send-email";
import { superadminRecipients } from "./superadmin-emails";
import {
  trialEndingEmail,
  superadminTrialEndingEmail,
  superadminInvoiceEmail,
} from "./emails";
import { captureServerError } from "./sentry";
import { sendOnce } from "./email-log";

// Prismodel + manuel fakturering (Billy). Tre maaneder gratis fra oprettelsen,
// derefter 49 kr./md. ekskl. moms (plans.ts). Ingen automatik lukker noget, kun
// superadmin. Milepaelene er datoer: varsel TRIAL_WARN_DAYS foer, og faktura-
// trigger naar proeveperioden er slut. De gemmes i de eksisterende fire-once-
// felter: cardholderWarnedAt = varsel givet, reached100At = fakturering startet.

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

/** Effektiv maanedspris i kr. En specialpris (fx founding member) gaelder indtil
 *  proPriceUntil; derefter falder butikken tilbage til standardprisen (49). */
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
      captureServerError(err, { route: "background:billing" });
    }
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

/**
 * Tjekker proeveperiodens milepaele for en butik (varsel og faktura-start).
 * Kaldes efter et nyt kortholder-kort (billigt) og fra den daglige cron.
 * Koeres efter svaret.
 */
export async function maybeFireTrialMilestones(businessId: string): Promise<void> {
  runAfterResponse(() => processTrialMilestones(businessId));
}

/**
 * Kernen bag milepaelene, saa den kan AFVENTES i tests. Hver milepael er en
 * atomisk fire-once (guardet updateMany), og kun VINDEREN sender mailen, saa to
 * samtidige kald giver praecis eet varsel.
 */
export async function processTrialMilestones(
  businessId: string,
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
  now: Date = new Date(),
): Promise<void> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: { slug: true, createdAt: true, cardholderWarnedAt: true, reached100At: true, stopped: true },
  });
  if (!biz || biz.slug === DEMO_SLUG) return; // demo taeller ikke med
  // Stoppet butik (ogsaa Folkas interne): ingen varsel og ingen faktura.
  if (biz.stopped) return;
  const ends = trialEndsAt(biz.createdAt);
  const warnFrom = new Date(ends.getTime() - TRIAL_WARN_DAYS * 86_400_000);

  // Varsel til ejeren (og superadmin): TRIAL_WARN_DAYS foer, eller med det samme,
  // hvis perioden allerede er slut.
  if (now >= warnFrom && !biz.cardholderWarnedAt) {
    const won = await db.business
      .updateMany({ where: { id: businessId, cardholderWarnedAt: null }, data: { cardholderWarnedAt: now } })
      .catch(() => ({ count: 0 }));
    if (won.count === 1) await sendTrialWarnEmails(businessId, db, sendMail, now);
  }

  // Faktura-start: proeveperioden er slut.
  if (now >= ends && !biz.reached100At) {
    const won = await db.business
      .updateMany({ where: { id: businessId, reached100At: null }, data: { reached100At: now } })
      .catch(() => ({ count: 0 }));
    if (won.count === 1) await sendInvoiceTriggerEmail(businessId, db, sendMail);
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

const dkDate = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", dateStyle: "long" });

const dkDateTime = new Intl.DateTimeFormat("da-DK", {
  timeZone: "Europe/Copenhagen",
  dateStyle: "long",
  timeStyle: "short",
});

/**
 * Sender varslet om proeveperiodens slutning (ejer + superadmin) og saetter
 * cardholderWarnEmailSentAt ved BEKRAEFTET levering. Fejler en mail, fanges det
 * i Sentry, og flaget forbliver null, saa den daglige sweep proever igen.
 */
export async function sendTrialWarnEmails(
  businessId: string,
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
  now: Date = new Date(),
): Promise<boolean> {
  const biz = await db.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      name: true,
      createdAt: true,
      proPriceKr: true,
      proPriceUntil: true,
      memberships: { select: { user: { select: { email: true } } } },
    },
  });
  if (!biz || biz.slug === DEMO_SLUG) return false;
  const ends = trialEndsAt(biz.createdAt);
  const endsOn = dkDate.format(ends);
  const ownerEmails = biz.memberships.map((m) => m.user.email).filter((e): e is string => Boolean(e));
  let allOk = true;

  const ownerMail = trialEndingEmail({
    businessName: biz.name,
    endsOn,
    ended: now >= ends,
    priceKr: effectiveProPriceKr(biz),
    agreementUrl: `${APP_URL}/app/aftale`,
  });
  // Hoejst een gang pr. modtager (EmailLog): fejler een modtager, sendes der
  // kun igen til den, ikke til dem, der allerede har faaet mailen.
  const once = (to: string, mail: { subject: string; html: string; text: string }) =>
    sendOnce({ businessId, kind: "trial-warn", recipient: to }, () => trySend(to, mail, sendMail), db);
  for (const to of ownerEmails) {
    if ((await once(to, ownerMail)) === "failed") allOk = false;
  }

  const recipients = superadminRecipients();
  if (recipients.length > 0) {
    const adminMail = superadminTrialEndingEmail({
      businessName: biz.name,
      slug: biz.slug,
      endsOn,
      cardholders: await countCardholders(businessId, db),
      ownerEmails: ownerEmails.join(", ") || "(ingen)",
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      if ((await once(to, adminMail)) === "failed") allOk = false;
    }
  }

  if (allOk) {
    await db.business.update({ where: { id: businessId }, data: { cardholderWarnEmailSentAt: new Date() } }).catch(() => {});
    return true;
  }
  captureServerError(new Error("Varsel om proeveperiode: en eller flere mails kunne ikke leveres"), {
    route: "billing:trial-warn",
    businessId,
  });
  return false;
}

/**
 * Sender faktura-trigger-mailen til superadmin, naar proeveperioden er slut, og
 * saetter reached100EmailSentAt ved BEKRAEFTET levering. Samme sweep-baserede
 * resiliens som varslet. Mailen samler alt til Billy-fakturaen.
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
      createdAt: true,
      proPriceKr: true,
      proPriceUntil: true,
      proApprovedAt: true,
      memberships: { select: { user: { select: { email: true } } } },
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
      trialEndedOn: dkDate.format(trialEndsAt(biz.createdAt)),
      priceKr: effectiveProPriceKr(biz),
      standardPriceKr: PRO_PRICE_DKK,
      approvedLabel: biz.proApprovedAt
        ? dkDateTime.format(biz.proApprovedAt)
        : "Ikke bekræftet endnu",
      ownerEmails:
        biz.memberships
          .map((m) => m.user.email)
          .filter((e): e is string => Boolean(e))
          .join(", ") || "(ingen)",
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      const r = await sendOnce(
        { businessId, kind: "invoice", recipient: to },
        () => trySend(to, mail, sendMail),
        db,
      );
      if (r === "failed") allOk = false;
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
 * Daglig sweep (cron). Foerst: butikker, hvis milepael er naaet (varsel eller
 * faktura-start), men endnu ikke registreret, behandles. Dernaest gensendes mails,
 * der aldrig blev leveret, saa et Resend-blip ikke taber varslet. Demo ekskluderet.
 */
export async function sweepPendingThresholdEmails(
  db: Db = prisma,
  sendMail: Mailer = sendEmail,
  now: Date = new Date(),
): Promise<{
  warns: number;
  invoices: number;
}> {
  // Oprettet foer denne dato = varsel-tidspunktet er naaet.
  const warnCutoff = new Date(now.getTime() + TRIAL_WARN_DAYS * 86_400_000);
  warnCutoff.setUTCMonth(warnCutoff.getUTCMonth() - TRIAL_MONTHS);
  const due = await db.business.findMany({
    where: {
      slug: { not: DEMO_SLUG },
      stopped: false,
      createdAt: { lte: warnCutoff },
      OR: [{ cardholderWarnedAt: null }, { reached100At: null }],
    },
    select: { id: true },
  });
  for (const b of due) await processTrialMilestones(b.id, db, sendMail, now);

  const [pendingWarns, pendingInvoices] = await Promise.all([
    db.business.findMany({
      where: {
        cardholderWarnedAt: { not: null },
        cardholderWarnEmailSentAt: null,
        slug: { not: DEMO_SLUG },
        stopped: false,
      },
      select: { id: true },
    }),
    db.business.findMany({
      where: {
        reached100At: { not: null },
        reached100EmailSentAt: null,
        slug: { not: DEMO_SLUG },
        stopped: false,
      },
      select: { id: true },
    }),
  ]);

  let warns = 0;
  for (const b of pendingWarns) {
    if (await sendTrialWarnEmails(b.id, db, sendMail, now)) warns += 1;
  }
  let invoices = 0;
  for (const b of pendingInvoices) {
    if (await sendInvoiceTriggerEmail(b.id, db, sendMail)) invoices += 1;
  }
  return { warns, invoices };
}

/**
 * Daglig integritets-vagt: finder kort hvor lifetimeStamps IKKE er lig
 * sum(Stamp.multiplier) - den invariant hele den atomiske stempel-sti beskytter.
 * En afvigelse betyder reel data-drift (fx en race, der slap igennem) og
 * rapporteres straks til Sentry. Ligger i SAMME cron som sweepet, fordi Hobby-
 * planen kun tillader to cron-jobs. Ren laesning; aendrer intet.
 *
 * Skalering: vi tjekker kun kort med aktivitet inden for de sidste 14 dage. Et
 * kort kan kun BRYDE invarianten, naar der stemples paa det, saa et kort uden
 * nye stempler kan ikke pludselig divergere. Det holder den daglige aggregering
 * paa de aktive kort i stedet for at summere HELE Stamp-tabellen hver nat.
 */
export async function checkStampInvariant(
  db: Db = prisma,
): Promise<{ diverged: number }> {
  const rows = await db.$queryRaw<
    { id: string; businessId: string; counter: number; actual: number }[]
  >`
    SELECT cc."id" AS "id", c."businessId" AS "businessId",
           cc."lifetimeStamps" AS "counter",
           COALESCE(SUM(s."multiplier"), 0)::int AS "actual"
    FROM "CustomerCard" cc
    JOIN "Card" c ON c."id" = cc."cardId"
    LEFT JOIN "Stamp" s ON s."customerCardId" = cc."id"
    WHERE cc."lastStampAt" >= NOW() - INTERVAL '14 days'
    GROUP BY cc."id", c."businessId", cc."lifetimeStamps"
    HAVING cc."lifetimeStamps" <> COALESCE(SUM(s."multiplier"), 0)
    LIMIT 50
  `;
  if (rows.length > 0) {
    captureServerError(
      new Error(
        `Stempel-invariant brudt: ${rows.length} kort hvor lifetimeStamps != sum(Stamp.multiplier)`,
      ),
      {
        route: "cron/invariant-check",
        extra: { count: rows.length, sample: JSON.stringify(rows.slice(0, 5)) },
      },
    );
  }
  return { diverged: rows.length };
}

// ── Godkendelsesside (ejer-dashboard) ────────────────────────────────

export type AgreementView = {
  cardholders: number;
  /** Sidste dag i de gratis maaneder. */
  trialEndsAt: Date;
  trialDaysLeft: number;
  inTrial: boolean;
  priceKr: number; // effektiv pris (specialpris eller standard)
  standardPriceKr: number;
  approved: boolean;
  approvedAt: Date | null;
};

/** Tilstanden til /app/aftale: i proeveperioden, efter, og om abonnementet er bekraeftet. */
export async function getAgreementView(businessId: string, now: Date = new Date()): Promise<AgreementView> {
  const biz = await prisma.business.findUnique({
    where: { id: businessId },
    select: { createdAt: true, proApprovedAt: true, proPriceKr: true, proPriceUntil: true },
  });
  const cardholders = await countCardholders(businessId);
  const ends = trialEndsAt(biz?.createdAt ?? now);
  const left = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / 86_400_000));
  return {
    cardholders,
    trialEndsAt: ends,
    trialDaysLeft: left,
    inTrial: now < ends,
    priceKr: biz ? effectiveProPriceKr(biz) : PRO_PRICE_DKK,
    standardPriceKr: PRO_PRICE_DKK,
    approved: Boolean(biz?.proApprovedAt),
    approvedAt: biz?.proApprovedAt ?? null,
  };
}
