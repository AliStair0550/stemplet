"use server";

import { prisma } from "@/lib/prisma";
import { getCardToken, setCardToken } from "@/lib/cookies";
import { loadCardByToken, createCardholderAtomically } from "@/lib/stamp";
import { maybeFireCardholderThresholds, signupBlockReason } from "@/lib/billing";

// claimCard RETURNERER nu et resultat i stedet for at redirecte, saa KLIENTEN kan
// bestemme hvad der sker: paa iPhone aabnes Apple Wallet DIREKTE med .pkpass'et
// (ingen mellemside med QR), og bagefter vises kvitteringen "Dit stempelkort er nu
// i din Wallet". Paa Android/desktop (ingen Wallet) sender klienten videre til
// webkortet /kort/[serial]. Fejl (lukket/pause/stoppet/fuld) vises ogsaa paa
// klienten via en kode, saa /k-siden kan forblive statisk (ISR).
export type ClaimResult =
  | { ok: true; serial: string }
  | { ok: false; error: "lukket" | "pause" | "stoppet" | "fuld" };

/** Opretter (eller genfinder) kundens kort og sætter device-cookie. */
export async function claimCard(slug: string): Promise<ClaimResult> {
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

  // Samme telefon rammer altid samme kort.
  const existingToken = await getCardToken(business.id);
  if (existingToken) {
    const cc = await loadCardByToken(existingToken);
    if (cc && cc.cardId === card.id) {
      return { ok: true, serial: cc.serial };
    }
  }

  // NYT kort: superadmin kan have stoppet butikken eller sat nye kortholdere paa
  // pause. Eksisterende kort ovenfor er allerede sendt videre til deres kort.
  const block = signupBlockReason(business);
  if (block) return { ok: false, error: block };

  // Vaekstmur paa Gratis: loftet tæller ALLE oprettede kort og haandhaeves atomisk
  // (race-sikkert) pr. butik. Kun oprettelse af NYE kort spærres - eksisterende
  // kunder stempler og indløser uhindret. Null = loftet er naaet.
  const created = await createCardholderAtomically(
    business.plan,
    business.id,
    card.id,
  );
  if (!created) return { ok: false, error: "fuld" };

  await setCardToken(business.id, created.authToken);
  // Fyr kortholder-taerskler (80-varsel / 100-krydsning), fire-once, efter svar.
  await maybeFireCardholderThresholds(business.id);
  return { ok: true, serial: created.serial };
}
