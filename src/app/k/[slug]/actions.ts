"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCardToken, setCardToken } from "@/lib/cookies";
import { loadCardByToken, createCardholderAtomically } from "@/lib/stamp";
import { maybeFireCardholderThresholds, signupBlockReason } from "@/lib/billing";

// Efter oprettelse sender vi ALTID kunden til webkortet (/kort/[serial]), ogsaa
// paa iPhone. Foer sendte vi iOS DIREKTE til .pkpass'et, saa Wallet aabnede med
// det samme, MEN en pkpass-hentning skifter ikke side: "Hent mit stempelkort"-
// knappen blev haengende i "Opretter dit kort..."-tilstand uden nogen kvittering.
// Paa /kort/[serial] faar kunden en tydelig "Laeg i Apple Wallet"-knap og en
// bekraeftelse ("Dit stempelkort er nu i din Wallet"), naar kortet er lagt i.

/** Opretter (eller genfinder) kundens kort og sætter device-cookie. */
export async function claimCard(slug: string) {
  const business = await prisma.business.findUnique({
    where: { slug },
    include: {
      cards: { where: { active: true }, orderBy: { createdAt: "asc" }, take: 1 },
    },
  });
  if (!business || business.cards.length === 0) {
    redirect(`/k/${slug}?fejl=lukket`);
  }
  const card = business.cards[0];

  // Samme telefon rammer altid samme kort.
  const existingToken = await getCardToken(business.id);
  if (existingToken) {
    const cc = await loadCardByToken(existingToken);
    if (cc && cc.cardId === card.id) {
      redirect(`/kort/${cc.serial}`);
    }
  }

  // NYT kort: superadmin kan have stoppet butikken eller sat nye kortholdere paa
  // pause. Eksisterende kort ovenfor er allerede sendt videre til deres kort.
  const block = signupBlockReason(business);
  if (block) redirect(`/k/${slug}?fejl=${block}`);

  // Vaekstmur paa Gratis: loftet tæller ALLE oprettede kort og haandhaeves atomisk
  // (race-sikkert) pr. butik. Kun oprettelse af NYE kort spærres - eksisterende
  // kunder stempler og indløser uhindret. Null = loftet er naaet.
  const created = await createCardholderAtomically(
    business.plan,
    business.id,
    card.id,
  );
  if (!created) redirect(`/k/${slug}?fejl=fuld`);

  await setCardToken(business.id, created.authToken);
  // Fyr kortholder-taerskler (80-varsel / 100-krydsning), fire-once, efter svar.
  await maybeFireCardholderThresholds(business.id);
  redirect(`/kort/${created.serial}`);
}
