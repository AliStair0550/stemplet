import "server-only";
import { prisma } from "./prisma";
import { slugify } from "./utils";
import { DEFAULT_PRIMARY, DEFAULT_TEXT, isStampIcon } from "./brand";
import { saveReferralRule } from "./referral";
import { parseRewardInput } from "./referral-text";
import { STAMPS_MAX, STAMPS_MIN, REWARD_TEXT_MAX } from "./system-config";
import { categoryFromStampIcon } from "./categories";

type Db = typeof prisma;

export class LoyaltyOnboardingError extends Error {
  constructor(
    public code: "EMAIL_TAKEN" | "INVALID_CARD" | "INVALID_REWARD" | "NO_MODULE",
    message: string,
  ) {
    super(message);
  }
}

export type LoyaltyInput = {
  name: string;
  email: string;
  /** Stempler paa kortet (null = fra; kan slaas til senere). */
  stamps: { rewardText: string; stampsRequired: number; stampIcon: string; welcomeStamp?: boolean } | null;
  /** Henvisninger paa kortet (null = fra; kan slaas til senere). */
  referral: { friendReward: string; referrerReward: string } | null;
};

/**
 * Selvbetjent oprettelse af loyalitetskortet (/start): butik, ejer, medlemskab,
 * kort og (valgfrit) henvisningsregel i EEN transaktion. Butikken vaelger, hvad
 * kortet kan fra start (stempler, henvisninger eller begge); resten kan slaas
 * til senere under Regler. Kortet (skabelonen) oprettes altid, fordi
 * kundekortene haenger paa det.
 */
export async function createLoyaltyBusiness(
  input: LoyaltyInput,
  db: Db = prisma,
): Promise<{ businessId: string; userId: string; slug: string }> {
  if (!input.stamps && !input.referral) {
    throw new LoyaltyOnboardingError("NO_MODULE", "Vælg mindst én ting, kortet skal kunne.");
  }

  let card = { stampsRequired: 10, rewardText: "Din belønning", stampIcon: "coffee" };
  if (input.stamps) {
    const rewardText = input.stamps.rewardText.trim().replace(/\s+/g, " ");
    const required = Math.round(input.stamps.stampsRequired);
    if (
      rewardText.length < 2 ||
      rewardText.length > REWARD_TEXT_MAX ||
      !(required >= STAMPS_MIN && required <= STAMPS_MAX) ||
      !isStampIcon(input.stamps.stampIcon)
    ) {
      throw new LoyaltyOnboardingError(
        "INVALID_CARD",
        `Skriv en belønning på højst ${REWARD_TEXT_MAX} tegn og vælg ${STAMPS_MIN} til ${STAMPS_MAX} stempler.`,
      );
    }
    card = { stampsRequired: required, rewardText, stampIcon: input.stamps.stampIcon };
  }

  const friend = input.referral ? parseRewardInput(input.referral.friendReward) : null;
  const referrer = input.referral ? parseRewardInput(input.referral.referrerReward) : null;
  if (input.referral && (!friend || !referrer)) {
    throw new LoyaltyOnboardingError("INVALID_REWARD", "Skriv hvad vennen og kunden får.");
  }

  if (await db.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw new LoyaltyOnboardingError("EMAIL_TAKEN", "Der findes allerede en konto med den e-mail. Log ind i stedet.");
  }

  const root = slugify(input.name) || "butik";
  let slug = root;
  for (let n = 2; await db.business.findUnique({ where: { slug }, select: { id: true } }); n++) {
    slug = `${root}-${n}`;
  }

  try {
    return await db.$transaction(async (tx) => {
      const b = await tx.business.create({
        select: { id: true, users: { select: { id: true } } },
        data: {
          name: input.name,
          slug,
          primaryColor: DEFAULT_PRIMARY,
          textColor: DEFAULT_TEXT,
          // Med stempler: stempelfelterne paa kortet fra start, som i
          // forhaandsvisningen paa /start (ikke en tom flade med navnet).
          cardStyle: input.stamps ? "stamps" : "color",
          // Branchen ud fra ikonet (saksen = frisør), saa den ikke skal vaelges igen.
          category: input.stamps ? categoryFromStampIcon(card.stampIcon) : null,
          termsAcceptedAt: new Date(),
          // Foerste stempel med det samme, naar kunden henter kortet (valget paa /start).
          welcomeStampEnabled: input.stamps?.welcomeStamp === true,
          stampsEnabled: !!input.stamps,
          referralsEnabled: !!input.referral,
          users: { create: { email: input.email, name: input.name } },
          cards: { create: { ...card, active: true } },
        },
      });
      const userId = b.users[0]!.id;
      await tx.membership.create({ data: { userId, businessId: b.id } });
      if (friend && referrer) {
        await saveReferralRule(
          b.id,
          {
            newCustomerRewardType: friend.type,
            newCustomerRewardValue: friend.value,
            referrerRewardType: referrer.type,
            referrerRewardValue: referrer.value,
            // Ingen betingelser som standard; kan saettes under Regler.
            maxReferralsPerMonth: null,
            rewardExpiryDays: 180,
          },
          tx as unknown as Db,
        );
      }
      return { businessId: b.id, userId, slug };
    });
  } catch (e) {
    if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
      throw new LoyaltyOnboardingError(
        "EMAIL_TAKEN",
        "Der findes allerede en konto med den e-mail, eller navnet er lige blevet taget. Prøv igen.",
      );
    }
    throw e;
  }
}
