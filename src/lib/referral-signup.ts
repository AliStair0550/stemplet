import "server-only";
import { prisma } from "./prisma";
import { createCardholderAtomically, hasActivePickupStamp, applyStamp } from "./stamp";
import { maybeFireTrialMilestones, signupBlockReason } from "./billing";
import { assignReferralCode, createReferral, ReferralError } from "./referral";
import { referralCodeCandidates } from "./referral-code";
import { parseContact } from "./contact";
import { deleteOrphanCard, findEmailOwner, saveContact } from "./contact-save";

// Henvisningssiden /henvisninger/[slug] (fase 2). Een kunde = eet kort pr. butik
// (docs/henvisninger.md): tilmeldingen genbruger kundens eksisterende kort, ellers
// oprettes et almindeligt kort med Stemplets egen, uaendrede createCardholderAtomically
// (loft + dedup pr. enhed). Ingen stempel-logik roeres: der gives aldrig stempler her.
//
// Aftalte regler (fase 2):
//  - Kendt kunde (kortet findes i forvejen paa enheden) bliver aldrig henvist.
//  - En e-mail der tilhoerer et andet kort i butikken afvises uden at afsloere
//    noget om kortet (uden bekraeftelse ved vi ikke, om det er kundens e-mail).
//    Tidligere brugte siden mobilnummer; gamle kort kan stadig have et.

type Db = typeof prisma;

export type ReferralSource = "LINK" | "CODE_ENTERED";

/** Henviseren bag en kode i butikken (kun fornavnet bruges paa siden). */
export async function findReferrerByCode(businessId: string, code: string, db: Db = prisma) {
  const candidates = referralCodeCandidates(code);
  if (candidates.length === 0) return null;
  return db.customerCard.findFirst({
    where: { businessId, referralCode: { in: candidates } },
    select: { id: true, name: true, referralCode: true },
  });
}

const visitorSelect = {
  id: true,
  cardId: true,
  authToken: true,
  name: true,
  phone: true,
  contactEmail: true,
  referralCode: true,
  referredByCardId: true,
} as const;

/** Kundens eget kort hos butikken: kort-cookien foerst, saa enheds-cookien. */
export async function findVisitorCard(
  activeCardId: string,
  cardToken: string | null | undefined,
  deviceId: string | null | undefined,
  db: Db = prisma,
) {
  if (cardToken) {
    const cc = await db.customerCard.findUnique({
      where: { authToken: cardToken },
      select: visitorSelect,
    });
    if (cc && cc.cardId === activeCardId) return cc;
  }
  if (deviceId) {
    return db.customerCard.findFirst({
      where: { cardId: activeCardId, deviceId },
      select: visitorSelect,
    });
  }
  return null;
}

export type SignupResult =
  | {
      ok: true;
      businessId: string;
      authToken: string;
      code: string;
      /** Kortet er henvist (af denne eller en tidligere tilmelding). */
      referred: boolean;
      /** Kom via en vens kode, men var allerede kunde: ingen henvisning. */
      alreadyCustomer: boolean;
      created: boolean;
    }
  | {
      ok: false;
      error: "lukket" | "pause" | "stoppet" | "fuld" | "navn" | "mail" | "mail_findes";
    };

/**
 * Tilmelding paa henvisningssiden: find eller opret kundens kort, gem navn,
 * e-mail og evt. samtykke til nyheder, giv en kode, og opret en aaben henvisning, hvis kunden kom via en kode
 * og er ny. Saetter ingen cookies; det goer ruten paa sit svar.
 */
export async function signupForReferrals(
  input: {
    slug: string;
    name: string;
    email: string;
    /** Frivilligt flueben: butikken maa kontakte kunden paa mail (fx tilbud). */
    consent?: boolean;
    code?: string | null;
    source?: ReferralSource;
    /** Kort-cookien for butikken (navnet afhaenger af butikkens id). */
    cardTokenFor?: (businessId: string) => string | null | undefined;
    deviceId?: string | null;
  },
  db: Db = prisma,
): Promise<SignupResult> {
  const parsed = parseContact({ name: input.name, email: input.email, consent: input.consent });
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const contact = parsed.contact;
  const name = contact.name;

  const shop = await db.business.findUnique({
    where: { slug: input.slug },
    select: {
      id: true,
      plan: true,
      stopped: true,
      newSignupsPaused: true,
      referralsEnabled: true,
      referralRule: { select: { id: true } },
      cards: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!shop?.referralsEnabled || !shop.referralRule || shop.cards.length === 0) {
    return { ok: false, error: "lukket" };
  }
  if (shop.stopped) return { ok: false, error: "stoppet" };
  const activeCardId = shop.cards[0]!.id;

  const referrer = input.code ? await findReferrerByCode(shop.id, input.code, db) : null;
  const emailOwner = await findEmailOwner(shop.id, contact.email, db);

  // ── Kendt kunde paa enheden: genbrug kortet, aldrig en henvisning ──
  const existing = await findVisitorCard(
    activeCardId,
    input.cardTokenFor?.(shop.id),
    input.deviceId,
    db,
  );
  if (existing) {
    if (emailOwner && emailOwner.id !== existing.id) return { ok: false, error: "mail_findes" };
    if (!(await saveContact(existing.id, shop.id, contact, db))) {
      return { ok: false, error: "mail_findes" };
    }
    const code = await assignReferralCode({ customerCardId: existing.id, name }, db);
    const referred = existing.referredByCardId !== null;
    return {
      ok: true,
      businessId: shop.id,
      authToken: existing.authToken,
      code,
      referred,
      alreadyCustomer: referrer !== null && !referred,
      created: false,
    };
  }

  // ── Ny kunde ──
  if (emailOwner) return { ok: false, error: "mail_findes" };
  const block = signupBlockReason(shop);
  if (block) return { ok: false, error: block };

  // Stemplets egen oprettelse, uaendret: loft (advisory-laas) og dedup pr. enhed.
  const created = await createCardholderAtomically(shop.id, activeCardId, db, input.deviceId ?? null);
  if (created.isNew) await maybeFireTrialMilestones(shop.id);

  // Samtidig tilmelding med samme e-mail: unik-indekset vinder, og den anden
  // faar "mail_findes". Det tomme kort, som dette kald lige oprettede, slettes.
  if (!(await saveContact(created.id, shop.id, contact, db))) {
    if (created.isNew) await deleteOrphanCard(created.id, db);
    return { ok: false, error: "mail_findes" };
  }
  const code = await assignReferralCode({ customerCardId: created.id, name }, db);

  // Dobbelttryk fra samme enhed: det andet kald faar det samme kort tilbage.
  // Henvisning og velkomststempel er allerede givet af det foerste.
  if (!created.isNew) {
    const card = await db.customerCard.findUnique({
      where: { id: created.id },
      select: { referredByCardId: true },
    });
    return {
      ok: true,
      businessId: shop.id,
      authToken: created.authToken,
      code,
      referred: card?.referredByCardId != null,
      alreadyCustomer: false,
      created: false,
    };
  }

  let referred = false;
  if (referrer) {
    try {
      await createReferral(
        {
          businessId: shop.id,
          referrerCardId: referrer.id,
          referredCardId: created.id,
          source: input.source ?? "LINK",
        },
        db,
      );
      referred = true;
    } catch (e) {
      // Kortet er oprettet uanset; en afvist henvisning (fx modulet slaaet fra
      // imens) maa ikke vaelte tilmeldingen.
      if (!(e instanceof ReferralError)) throw e;
    }
  }

  // Samme som stempelkortets oprettelse: koerer "stempel ved afhentning", faar
  // det nye kort sit stempel. Best-effort; kortet er oprettet uanset.
  if (await hasActivePickupStamp(activeCardId)) {
    try {
      await applyStamp({ customerCardId: created.id, method: "MANUAL", skipCooldown: true, count: 1 });
    } catch {
      /* stempel best-effort */
    }
  }

  return {
    ok: true,
    businessId: shop.id,
    authToken: created.authToken,
    code,
    referred,
    alreadyCustomer: false,
    created: true,
  };
}
