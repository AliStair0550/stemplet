import "server-only";
import { prisma } from "./prisma";
import { createCardholderAtomically } from "./stamp";
import { maybeFireCardholderThresholds, signupBlockReason } from "./billing";
import { assignReferralCode, createReferral, ReferralError } from "./referral";
import { normalizeReferralCode } from "./referral-code";
import { normalizePhone } from "./phone";

// Henvisningssiden /henvisninger/[slug] (fase 2). Een kunde = eet kort pr. butik
// (docs/henvisninger.md): tilmeldingen genbruger kundens eksisterende kort, ellers
// oprettes et almindeligt kort med Stemplets egen, uaendrede createCardholderAtomically
// (loft + dedup pr. enhed). Ingen stempel-logik roeres: der gives aldrig stempler her.
//
// Aftalte regler (fase 2):
//  - Kendt kunde (kortet findes i forvejen paa enheden) bliver aldrig henvist.
//  - Et mobilnummer der tilhoerer et andet kort i butikken afvises uden at afsloere
//    noget om kortet (uden SMS-bekraeftelse ved vi ikke, om det er kundens nummer).

type Db = typeof prisma;

export type ReferralSource = "LINK" | "CODE_ENTERED";

/** Butik + regel til siden. null = siden findes ikke (modul slaaet fra/ikke sat op). */
export async function loadReferralShop(slug: string, db: Db = prisma) {
  const business = await db.business.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      displayName: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      textColor: true,
      bookingUrl: true,
      referralsEnabled: true,
      referralRule: true,
      cards: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
  if (!business?.referralsEnabled || !business.referralRule || business.cards.length === 0) {
    return null;
  }
  return { ...business, rule: business.referralRule, activeCardId: business.cards[0]!.id };
}

/** Henviseren bag en kode i butikken (kun fornavnet bruges paa siden). */
export async function findReferrerByCode(businessId: string, code: string, db: Db = prisma) {
  const normalized = normalizeReferralCode(code);
  if (!normalized) return null;
  return db.customerCard.findFirst({
    where: { businessId, referralCode: normalized },
    select: { id: true, name: true, referralCode: true },
  });
}

const visitorSelect = {
  id: true,
  cardId: true,
  authToken: true,
  name: true,
  phone: true,
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
      error: "lukket" | "pause" | "stoppet" | "fuld" | "navn" | "mobil" | "mobil_findes";
    };

const NAME_MAX = 40;

/**
 * Tilmelding paa henvisningssiden: find eller opret kundens kort, gem navn og
 * mobil, giv en kode, og opret en aaben henvisning, hvis kunden kom via en kode
 * og er ny. Saetter ingen cookies; det goer ruten paa sit svar.
 */
export async function signupForReferrals(
  input: {
    slug: string;
    name: string;
    phone: string;
    code?: string | null;
    source?: ReferralSource;
    /** Kort-cookien for butikken (navnet afhaenger af butikkens id). */
    cardTokenFor?: (businessId: string) => string | null | undefined;
    deviceId?: string | null;
  },
  db: Db = prisma,
): Promise<SignupResult> {
  const name = input.name.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > NAME_MAX) return { ok: false, error: "navn" };
  const phone = normalizePhone(input.phone);
  if (!phone) return { ok: false, error: "mobil" };

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
  const phoneOwner = await db.customerCard.findFirst({
    where: { businessId: shop.id, phone },
    select: { id: true },
  });

  // ── Kendt kunde paa enheden: genbrug kortet, aldrig en henvisning ──
  const existing = await findVisitorCard(
    activeCardId,
    input.cardTokenFor?.(shop.id),
    input.deviceId,
    db,
  );
  if (existing) {
    if (phoneOwner && phoneOwner.id !== existing.id) return { ok: false, error: "mobil_findes" };
    if (!existing.phone) {
      const saved = await savePhone(existing.id, shop.id, phone, db);
      if (!saved) return { ok: false, error: "mobil_findes" };
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
  if (phoneOwner) return { ok: false, error: "mobil_findes" };
  const block = signupBlockReason(shop);
  if (block) return { ok: false, error: block };

  // Stemplets egen oprettelse, uaendret: loft (advisory-laas) og dedup pr. enhed.
  const created = await createCardholderAtomically(
    shop.plan,
    shop.id,
    activeCardId,
    db,
    input.deviceId ?? null,
  );
  if (!created) return { ok: false, error: "fuld" };
  await maybeFireCardholderThresholds(shop.id);

  // Samtidig tilmelding med samme nummer: unik-indekset vinder, og den anden
  // faar "mobil_findes" (kortet er stadig enhedens eget og genbruges naeste gang).
  if (!(await savePhone(created.id, shop.id, phone, db))) {
    return { ok: false, error: "mobil_findes" };
  }
  const code = await assignReferralCode({ customerCardId: created.id, name }, db);

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

/** Gem mobilen, hvis kortet ikke har en. false = nummeret er taget af et andet kort. */
async function savePhone(cardId: string, businessId: string, phone: string, db: Db) {
  try {
    await db.customerCard.updateMany({
      where: { id: cardId, phone: null },
      data: { phone, businessId },
    });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return false;
    throw e;
  }
}
