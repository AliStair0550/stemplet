import "server-only";
import { prisma } from "./prisma";
import type { Contact } from "./contact";

type Db = typeof prisma;

/** Kortet i butikken, der allerede har denne e-mail (eller null). */
export async function findEmailOwner(businessId: string, email: string, db: Db = prisma) {
  return db.customerCard.findFirst({
    where: { businessId, contactEmail: email },
    select: { id: true },
  });
}

/**
 * Gem kontaktdata paa kortet, men kun i tomme felter: et navn, en e-mail eller et
 * samtykke, der allerede staar paa kortet, overskrives aldrig. Saetter ogsaa den
 * denormaliserede butik (bruges af unik-indekset pr. butik).
 * false = e-mailen tilhoerer allerede et andet kort i butikken.
 */
export async function saveContact(
  cardId: string,
  businessId: string,
  contact: Contact,
  db: Db = prisma,
): Promise<boolean> {
  await db.customerCard.updateMany({
    where: { id: cardId, name: null },
    data: { name: contact.name },
  });
  try {
    await db.customerCard.updateMany({
      where: { id: cardId, contactEmail: null },
      data: { contactEmail: contact.email, businessId },
    });
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return false;
    throw e;
  }
  if (contact.consent) {
    await db.customerCard.updateMany({
      where: { id: cardId, marketingConsentAt: null },
      data: { marketingConsentAt: new Date() },
    });
  }
  return true;
}

/** Sletter et netop oprettet kort, der aldrig fik kontakt eller stempler (taberen
 *  af et dobbelttryk). Best-effort: fejler det, ligger kortet bare tomt. */
export async function deleteOrphanCard(id: string, db: Db = prisma): Promise<void> {
  await db.customerCard
    .deleteMany({ where: { id, stamps: 0, lifetimeStamps: 0, contactEmail: null } })
    .catch(() => {});
}
