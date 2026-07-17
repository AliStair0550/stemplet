import "server-only";
import { after } from "next/server";
import { prisma } from "./prisma";
import { APP_URL } from "./env";
import { DEMO_SLUG } from "./demo";
import { PRO_PRICE_DKK, FREE_CUSTOMER_LIMIT, FREE_CUSTOMER_WARN } from "./plans";
import { sendEmail } from "./send-email";
import { superadminRecipients } from "./superadmin-emails";
import { cardholderWarningEmail, superadminThresholdEmail } from "./emails";

// Prismodel + manuel fakturering (Billy). Ingen automatik lukker noget - kun
// superadmin. Kortholder-definitionen EER kanonisk her og genbruges overalt.

/** En kortholder = eet CustomerCard for butikken. Samme definition overalt. */
export async function countCardholders(businessId: string): Promise<number> {
  const cards = await prisma.card.findMany({
    where: { businessId },
    select: { id: true },
  });
  const cardIds = cards.map((c) => c.id);
  if (cardIds.length === 0) return 0;
  return prisma.customerCard.count({ where: { cardId: { in: cardIds } } });
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
 * Kaldes efter at et NYT kortholder-kort er oprettet. Udloeser (kun EEN gang per
 * butik) 80-varslet og registrerer 100-krydsningen. Koeres efter svaret, saa
 * kunde-tilmeldingen ikke forsinkes, og fanger sine egne fejl.
 */
export async function maybeFireCardholderThresholds(
  businessId: string,
): Promise<void> {
  runAfterResponse(async () => {
    const biz = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        cardholderWarnedAt: true,
        reached100At: true,
        users: { select: { email: true } },
        cards: { select: { id: true } },
      },
    });
    if (!biz || biz.slug === DEMO_SLUG) return; // demo taeller ikke med
    const cardIds = biz.cards.map((c) => c.id);
    if (cardIds.length === 0) return;
    const count = await prisma.customerCard.count({
      where: { cardId: { in: cardIds } },
    });

    // 100-krydsning: registrér dagen (faktura-start-reference). Fire once.
    if (count >= CARDHOLDER_LIMIT && !biz.reached100At) {
      await prisma.business
        .updateMany({
          where: { id: businessId, reached100At: null },
          data: { reached100At: new Date() },
        })
        .catch(() => {});
    }

    // 80-varsel: atomisk fire-once. Kun den der vinder opdateringen sender mails.
    if (count >= CARDHOLDER_WARN && !biz.cardholderWarnedAt) {
      const won = await prisma.business
        .updateMany({
          where: { id: businessId, cardholderWarnedAt: null },
          data: { cardholderWarnedAt: new Date() },
        })
        .catch(() => ({ count: 0 }));
      if (won.count === 1) {
        await sendThresholdEmails(biz, count);
      }
    }
  });
}

async function sendThresholdEmails(
  biz: { name: string; slug: string; users: { email: string | null }[] },
  count: number,
): Promise<void> {
  const ownerEmails = biz.users
    .map((u) => u.email)
    .filter((e): e is string => Boolean(e));

  // Til ejeren: venligt varsel + link til godkendelsessiden.
  const ownerMail = cardholderWarningEmail({
    businessName: biz.name,
    cardholders: count,
    limit: CARDHOLDER_LIMIT,
    priceKr: PRO_PRICE_DKK,
    agreementUrl: `${APP_URL}/app/aftale`,
  });
  for (const to of ownerEmails) {
    await sendEmail({ to, ...ownerMail }).catch((e) =>
      console.error("Kortholder-varsel til ejer fejlede", e),
    );
  }

  // Til superadmin(erne): hvem er paa vej over.
  const recipients = superadminRecipients();
  if (recipients.length > 0) {
    const adminMail = superadminThresholdEmail({
      businessName: biz.name,
      slug: biz.slug,
      cardholders: count,
      limit: CARDHOLDER_LIMIT,
      ownerEmails: ownerEmails.join(", ") || "(ingen)",
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      await sendEmail({ to, ...adminMail }).catch((e) =>
        console.error("Kortholder-varsel til superadmin fejlede", e),
      );
    }
  }
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
