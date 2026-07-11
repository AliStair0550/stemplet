"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCardToken, setCardToken } from "@/lib/cookies";
import { loadCardByToken } from "@/lib/stamp";
import { generateSerial, generateAuthToken } from "@/lib/ids";
import { withinCustomerLimit } from "@/lib/plans";

/** Opretter (eller genfinder) kundens kort og sætter device-cookie. */
export async function claimCard(slug: string, _formData?: FormData) {
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

  // Plan-loft på Gratis: tæller aktive kunder (stemplet inden for 60 dage),
  // så gamle engangskunder ikke blokerer for nye.
  if (business.plan === "FREE") {
    const d60 = new Date();
    d60.setDate(d60.getDate() - 60);
    const active = await prisma.customerCard.count({
      where: {
        card: { businessId: business.id },
        lastStampAt: { gte: d60 },
      },
    });
    if (!withinCustomerLimit("FREE", active)) {
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
  redirect(`/kort/${cc.serial}`);
}
