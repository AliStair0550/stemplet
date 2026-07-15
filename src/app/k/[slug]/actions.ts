"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCardToken, setCardToken } from "@/lib/cookies";
import { loadCardByToken } from "@/lib/stamp";
import { generateSerial, generateAuthToken } from "@/lib/ids";
import { canCreateCustomer } from "@/lib/plans";
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

  // Vaekstmur paa Gratis: loftet tæller ALLE oprettede kort. Kun oprettelse af
  // NYE kort spærres ved loftet - eksisterende kunder stempler og indløser
  // uhindret (det haandteres helt andre steder end her).
  if (business.plan === "FREE") {
    const total = await prisma.customerCard.count({
      where: { card: { businessId: business.id } },
    });
    if (!canCreateCustomer("FREE", total)) {
      redirect(`/k/${slug}?fejl=fuld`);
    }
  }

  const cc = await prisma.customerCard.create({
    data: {
      cardId: card.id,
      serial: generateSerial(),
      authToken: generateAuthToken(),
    },
  });
  await setCardToken(business.id, cc.authToken);
  redirect(await claimDestination(cc.serial));
}
