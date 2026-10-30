"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { cardDesignSchema } from "@/lib/validation";
import { isCardStyle, normalizeActions } from "@/lib/card-look";
import { processArtwork, ArtworkError } from "@/lib/card-artwork";
import { isCardArt } from "@/lib/card-art";
import type { CardDesign } from "@/components/CardDesigner";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Gem Design: butikkens udseende (farver, ikon, navn, logo, stil, eget billede
 * og knapper). Reglerne for stempler og henvisninger gemmes hos hvert produkt.
 */
export async function saveCardLook(input: {
  design: CardDesign;
  style: string;
  /** Nyt billede (data-URI), "keep" = behold det gemte, null = fjern. */
  artwork: string | "keep" | null;
  actions: string[];
  /** Motiv og accent (stilen "Motiv"); accent null = automatisk. */
  art?: string | null;
  accent?: string | null;
  /** Booking-link (Book tid-knappen); undefined = uaendret, "" = fjern. */
  bookingUrl?: string;
}): Promise<Result> {
  const { business } = await requireBusiness();
  const parsed = cardDesignSchema.safeParse(input.design);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  if (!isCardStyle(input.style)) return { ok: false, error: "Vælg en stil." };
  const art = isCardArt(input.art) ? input.art : null;
  const accent = input.accent && /^#[0-9a-f]{6}$/i.test(input.accent) ? input.accent : null;
  if (input.style === "art" && !art) return { ok: false, error: "Vælg et motiv." };
  let artwork: string | null | undefined;
  if (input.artwork === "keep") artwork = undefined;
  else if (input.artwork === null) artwork = null;
  else {
    try {
      artwork = await processArtwork(input.artwork);
    } catch (e) {
      return { ok: false, error: e instanceof ArtworkError ? e.message : "Billedet kunne ikke gemmes." };
    }
  }
  if (input.style === "photo" && artwork === null) {
    return { ok: false, error: "Upload et billede, eller vælg en anden stil." };
  }
  if (input.style === "photo" && artwork === undefined && !business.cardArtwork) {
    return { ok: false, error: "Upload et billede, eller vælg en anden stil." };
  }

  const rawBooking = input.bookingUrl === undefined ? undefined : input.bookingUrl.trim().slice(0, 300);
  if (rawBooking && !/^https?:\/\/\S+$/i.test(rawBooking)) {
    return { ok: false, error: "Booking-linket skal starte med https://" };
  }
  const bookingUrl = rawBooking === undefined ? business.bookingUrl : rawBooking || null;
  if (input.actions.includes("book") && !bookingUrl) {
    return { ok: false, error: "Indsæt dit booking-link, eller fravælg Book tid." };
  }
  const actions = normalizeActions(input.actions, {
    stampsEnabled: business.stampsEnabled,
    referralsEnabled: business.referralsEnabled,
    bookingUrl,
  });

  // Ikonet hoerer til udseendet, men gemmes paa stempelkortet (som i Wallet).
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (card) {
    await prisma.card.update({ where: { id: card.id }, data: { stampIcon: parsed.data.stampIcon } });
  }

  await prisma.business.update({
    where: { id: business.id },
    data: {
      primaryColor: parsed.data.primaryColor,
      textColor: parsed.data.textColor,
      logoUrl: parsed.data.logoUrl ?? null,
      logoScale: parsed.data.logoScale,
      displayName: parsed.data.displayName?.trim() || null,
      ...(parsed.data.cardHeader ? { cardHeader: parsed.data.cardHeader } : {}),
      cardStyle: input.style,
      ...(artwork !== undefined ? { cardArtwork: artwork } : {}),
      cardActions: actions,
      ...(rawBooking !== undefined ? { bookingUrl } : {}),
      ...(art ? { cardArt: art } : {}),
      cardAccent: accent,
    },
  });

  revalidatePath("/app/kortet");
  revalidatePath("/app/regler");
  revalidatePath("/app");
  // Kundesiderne er cachet pr. butik: farver og logo slaar igennem med det samme.
  revalidatePath(`/k/${business.slug}`);
  // Kort, der allerede ligger i kundernes Wallet, faar det nye udseende via en
  // stille opdatering (efter svaret, saa gem er hurtigt).
  if (WALLET_ENABLED) {
    after(async () => {
      const { pushAllWalletPasses } = await import("@/lib/wallet/build");
      await pushAllWalletPasses({ businessId: business.id }).catch(() => {});
    });
  }
  return { ok: true };
}
