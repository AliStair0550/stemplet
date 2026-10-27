import "server-only";
import { prisma } from "./prisma";
import { getCardToken } from "./cookies";
import {
  loadCardByToken,
  createCardholderAtomically,
  hasActivePickupStamp,
  applyStamp,
} from "./stamp";
import { signupBlockReason } from "./billing";
import { withDbRetry } from "./db-retry";
import type { Contact } from "./contact";
import { findEmailOwner, saveContact } from "./contact-save";

// "kontakt" = ny kunde uden navn og e-mail (kun GET-linket): send til formularen.
// "mail_findes" = e-mailen hoerer allerede til et andet kort i butikken.
export type ClaimError = "lukket" | "pause" | "stoppet" | "fuld" | "kontakt" | "mail_findes";
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
//
// Et NYT kort kraever kontaktdata (navn + e-mail fra formularen paa /k). Uden
// kontakt genfindes kun et eksisterende kort; ellers "kontakt". Saa kan det
// rigtige Wallet-link (GET) aldrig oprette et kort uden om formularen, mens en
// returkunde stadig kommer i Wallet med eet tryk.
export async function resolveOrCreateCard(
  slug: string,
  deviceId: string | null = null,
  contact: Contact | null = null,
  // Kort-cookien for butikken. Injicerbar, saa integrationstests kan koere uden
  // en request (cookies() virker kun inde i en request).
  readCardToken: (businessId: string) => Promise<string | undefined> = getCardToken,
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
  const existingToken = await readCardToken(business.id);
  if (existingToken) {
    const cc = await loadCardByToken(existingToken);
    if (cc && cc.cardId === card.id) {
      // Returkunde, der udfyldte formularen: udfyld kun tomme felter.
      if (contact) await saveContact(cc.id, business.id, contact);
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
      select: { id: true, serial: true, authToken: true },
    });
    if (cc) {
      if (contact) await saveContact(cc.id, business.id, contact);
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

  // Intet kort uden navn og e-mail. Er e-mailen allerede paa et andet kort i
  // butikken, opretter vi ikke et nyt (uden bekraeftelse ved vi ikke, om det er
  // kundens egen e-mail, saa vi udleverer heller ikke det eksisterende kort).
  if (!contact) return { ok: false, error: "kontakt" };
  if (await findEmailOwner(business.id, contact.email)) {
    return { ok: false, error: "mail_findes" };
  }

  // Loftet (hvis aktivt) haandhaeves atomisk pr. butik. Null = loftet er naaet.
  const created = await createCardholderAtomically(
    business.plan,
    business.id,
    card.id,
    prisma,
    deviceId,
  );
  if (!created) return { ok: false, error: "fuld" };

  // Samtidig oprettelse med samme e-mail: unik-indekset vinder. Kortet er stadig
  // enhedens eget (genbruges naeste gang), men uden e-mail.
  if (!(await saveContact(created.id, business.id, contact))) {
    return { ok: false, error: "mail_findes" };
  }

  // Stempel ved afhentning: koerer der en aktiv PICKUP_STAMP-kampagne, faar det
  // nye kort 1 stempel med det samme (kortet lander i Wallet med 1/x). MANUAL
  // springer cooldown over og er system-givet. En fejl her maa ikke vaelte
  // afhentningen, saa vi sluger den (kortet er stadig oprettet).
  if (await hasActivePickupStamp(card.id)) {
    try {
      await applyStamp({
        customerCardId: created.id,
        method: "MANUAL",
        skipCooldown: true,
        count: 1,
      });
    } catch {
      /* stempel best-effort: kortet er hentet uanset */
    }
  }

  return {
    ok: true,
    serial: created.serial,
    authToken: created.authToken,
    businessId: business.id,
    created: true,
  };
}
