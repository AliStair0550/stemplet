import "server-only";
import { prisma } from "./prisma";
import { slugify } from "./utils";
import { saveReferralRule } from "./referral";
import { parseRewardInput } from "./referral-text";

type Db = typeof prisma;

export class ReferralOnboardingError extends Error {
  constructor(
    public code: "EMAIL_TAKEN" | "INVALID_REWARD",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Selvbetjent oprettelse via Henvisninger (/start?produkt=henvisninger): butik,
 * ejer, medlemskab og henvisningsregel i EEN transaktion. Henvisninger er slaaet
 * til og Stemplet fra; Stemplet kan ejeren selv slaa til i dashboardet. Kortet
 * (skabelonen) oprettes med standardvaerdier, fordi kundekortene haenger paa det.
 */
export async function createReferralBusiness(
  input: { name: string; email: string; friendReward: string; referrerReward: string },
  db: Db = prisma,
): Promise<{ businessId: string; userId: string; slug: string }> {
  const friend = parseRewardInput(input.friendReward);
  const referrer = parseRewardInput(input.referrerReward);
  if (!friend || !referrer) {
    throw new ReferralOnboardingError("INVALID_REWARD", "Skriv hvad vennen og kunden får.");
  }
  if (await db.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw new ReferralOnboardingError("EMAIL_TAKEN", "Der findes allerede en konto med den e-mail. Log ind i stedet.");
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
          termsAcceptedAt: new Date(),
          welcomeStampEnabled: false,
          referralsEnabled: true,
          stampsEnabled: false,
          users: { create: { email: input.email, name: input.name } },
          cards: { create: { stampsRequired: 10, rewardText: "Din belønning", active: true } },
        },
      });
      const userId = b.users[0]!.id;
      await tx.membership.create({ data: { userId, businessId: b.id } });
      await saveReferralRule(
        b.id,
        {
          newCustomerRewardType: friend.type,
          newCustomerRewardValue: friend.value,
          referrerRewardType: referrer.type,
          referrerRewardValue: referrer.value,
          // Ingen betingelser som standard; kan saettes under Indstillinger.
          maxReferralsPerMonth: null,
          rewardExpiryDays: 180,
        },
        tx as unknown as Db,
      );
      return { businessId: b.id, userId, slug };
    });
  } catch (e) {
    if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
      throw new ReferralOnboardingError(
        "EMAIL_TAKEN",
        "Der findes allerede en konto med den e-mail, eller navnet er lige blevet taget. Prøv igen.",
      );
    }
    throw e;
  }
}
