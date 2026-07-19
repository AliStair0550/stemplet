import "server-only";
import { prisma } from "./prisma";
import { getCardToken } from "./cookies";
import { loadCardByToken, createCardholderAtomically } from "./stamp";
import { signupBlockReason } from "./billing";

export type ClaimError = "lukket" | "pause" | "stoppet" | "fuld";
export type ResolvedCard =
  | {
      ok: true;
      serial: string;
      authToken: string;
      businessId: string;
      created: boolean;
    }
  | { ok: false; error: ClaimError };

// Delt kerne for "Hent mit stempelkort": find butik + aktivt kort, genfind
// kundens kort via device-cookien, eller opret et nyt (race-sikkert, med evt.
// loft). SAETTER IKKE cookien og fyrer IKKE taerskler - det goer kalderen (claim-
// ruten), saa cookien kan saettes paa den maade der er paalidelig i konteksten.
export async function resolveOrCreateCard(slug: string): Promise<ResolvedCard> {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business || business.cards.length === 0) {
    return { ok: false, error: "lukket" };
  }
  const card = business.cards[0];

  // Samme telefon rammer altid samme kort (device-cookie).
  const existingToken = await getCardToken(business.id);
  if (existingToken) {
    const cc = await loadCardByToken(existingToken);
    if (cc && cc.cardId === card.id) {
      return {
        ok: true,
        serial: cc.serial,
        authToken: existingToken,
        businessId: business.id,
        created: false,
      };
    }
  }

  // NYT kort: superadmin kan have stoppet butikken eller sat nye kort paa pause.
  const block = signupBlockReason(business);
  if (block) return { ok: false, error: block };

  // Loftet (hvis aktivt) haandhaeves atomisk pr. butik. Null = loftet er naaet.
  const created = await createCardholderAtomically(
    business.plan,
    business.id,
    card.id,
  );
  if (!created) return { ok: false, error: "fuld" };

  return {
    ok: true,
    serial: created.serial,
    authToken: created.authToken,
    businessId: business.id,
    created: true,
  };
}
