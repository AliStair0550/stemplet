"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCardToken, setCardToken } from "@/lib/cookies";
import { loadCardByToken, createCardholderAtomically } from "@/lib/stamp";
import { maybeFireCardholderThresholds, signupBlockReason } from "@/lib/billing";
import { WALLET_ENABLED } from "@/lib/env";

// Hele pointen er, at kortet ryger i Apple Wallet. Paa iPhone/iPad sender vi
// derfor kunden DIREKTE til .pkpass'et, saa Wallet aabner med det samme (ikke en
// mellemside med QR). Paa Android/desktop, hvor Wallet ikke findes, viser vi
// webkortet med QR + knap i stedet.
async function claimDestination(serial: string): Promise<string> {
  const ua = (await headers()).get("user-agent") ?? "";
  const ios = /iPhone|iPad|iPod/i.test(ua);
  return ios && WALLET_ENABLED ? `/api/wallet/pass/${serial}` : `/kort/${serial}`;
}

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
      redirect(await claimDestination(cc.serial));
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
  redirect(await claimDestination(created.serial));
}
