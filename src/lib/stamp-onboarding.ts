import "server-only";
import { prisma } from "./prisma";
import { slugify } from "./utils";
import { isStampIcon } from "./brand";
import { STAMPS_MAX, STAMPS_MIN, REWARD_TEXT_MAX } from "./system-config";

type Db = typeof prisma;

// Standardfarverne fra kortdesigneren ("Sand"); kan aendres under Design.
const DEFAULT_PRIMARY = "#EFEBE3";
const DEFAULT_TEXT = "#1E2633";

export class StampOnboardingError extends Error {
  constructor(
    public code: "EMAIL_TAKEN" | "INVALID_CARD",
    message: string,
  ) {
    super(message);
  }
}

/**
 * Selvbetjent oprettelse af Stemplet (/start), samme form som Henvisninger:
 * butik, ejer, medlemskab og stempelkort i EEN transaktion. Stemplet er slaaet
 * til; Henvisninger kan slaas til senere. Farver og logo saettes under Design.
 */
export async function createStampBusiness(
  input: { name: string; email: string; rewardText: string; stampsRequired: number; stampIcon: string },
  db: Db = prisma,
): Promise<{ businessId: string; userId: string; slug: string }> {
  const rewardText = input.rewardText.trim().replace(/\s+/g, " ");
  const required = Math.round(input.stampsRequired);
  if (
    rewardText.length < 2 ||
    rewardText.length > REWARD_TEXT_MAX ||
    !(required >= STAMPS_MIN && required <= STAMPS_MAX) ||
    !isStampIcon(input.stampIcon)
  ) {
    throw new StampOnboardingError(
      "INVALID_CARD",
      `Skriv en belønning på højst ${REWARD_TEXT_MAX} tegn og vælg ${STAMPS_MIN} til ${STAMPS_MAX} stempler.`,
    );
  }
  if (await db.user.findUnique({ where: { email: input.email }, select: { id: true } })) {
    throw new StampOnboardingError("EMAIL_TAKEN", "Der findes allerede en konto med den e-mail. Log ind i stedet.");
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
          termsAcceptedAt: new Date(),
          welcomeStampEnabled: false,
          stampsEnabled: true,
          referralsEnabled: false,
          users: { create: { email: input.email, name: input.name } },
          cards: {
            create: { stampsRequired: required, rewardText, stampIcon: input.stampIcon, active: true },
          },
        },
      });
      const userId = b.users[0]!.id;
      await tx.membership.create({ data: { userId, businessId: b.id } });
      return { businessId: b.id, userId, slug };
    });
  } catch (e) {
    if (e && typeof e === "object" && (e as { code?: string }).code === "P2002") {
      throw new StampOnboardingError(
        "EMAIL_TAKEN",
        "Der findes allerede en konto med den e-mail, eller navnet er lige blevet taget. Prøv igen.",
      );
    }
    throw e;
  }
}
