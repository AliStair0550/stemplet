import "server-only";
import { prisma } from "./prisma";
import { getCardToken } from "./cookies";
import { loadCardByToken, createCardholderAtomically } from "./stamp";
import { signupBlockReason } from "./billing";
import { withDbRetry } from "./db-retry";

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
export async function resolveOrCreateCard(
  slug: string,
  deviceId: string | null = null,
): Promise<ResolvedCard> {
  // Foerste DB-touch i claim-flowet: mest udsat for et Neon cold start, saa den
  // koeres med korte retries paa forbigaaende forbindelsesfejl. Er computen
  // vaekket her, er resten af requesten varm.
  const business = await withDbRetry(() =>
    prisma.business.findUnique({
      where: { slug },
      include: {
        cards: {
          where: { active: true },
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    }),
  );
  if (!business || business.cards.length === 0) {
    return { ok: false, error: "lukket" };
  }
  const card = business.cards[0];

  // Samme telefon rammer altid samme kort (kort-cookie).
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

  // Enheds-fallback: mistede kunden kort-cookien (ryddet/anden fane), men har
  // stadig enheds-cookien, saa genfind deres eksisterende kort i stedet for et
  // nyt tomt. Ligger FOER loft/pause-check, saa en returkunde altid faar sit kort.
  if (deviceId) {
    const cc = await prisma.customerCard.findFirst({
      where: { cardId: card.id, deviceId },
      select: { serial: true, authToken: true },
    });
    if (cc) {
      return {
        ok: true,
        serial: cc.serial,
        authToken: cc.authToken,
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
    prisma,
    deviceId,
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
