"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { refreshShop } from "@/lib/shop-refresh";
import { nextNewsAllowedAt, parseNews, sameAsCurrent } from "@/lib/news";
import { walletCardCount } from "@/lib/news-reach";

export type NewsResult = { ok: true; recipients: number } | { ok: false; error: string };

/**
 * Send en pushbesked: teksten laegges paa kundernes kort, og alle kort i Wallet
 * opdateres, saa iPhone viser den som notifikation paa laaseskaermen. Hoejst een
 * besked i doegnet (kontrolleres her, ikke kun i formularen).
 */
export async function sendNewsAction(text: string): Promise<NewsResult> {
  const { business } = await requireBusiness();
  const parsed = parseNews(text);
  if (!parsed.ok) return parsed;
  // Stoppet butik: ingen notifikationer paa kundernes laaseskaerm.
  if (business.stopped) return { ok: false, error: "Butikken er sat på pause, så der kan ikke sendes pushbeskeder." };
  if (nextNewsAllowedAt(business.newsSentAt)) {
    return { ok: false, error: "Du kan sende én pushbesked i døgnet. Prøv igen senere." };
  }
  if (sameAsCurrent(parsed.value, business.newsText)) {
    return { ok: false, error: "Det er den samme besked, som står på kortene nu. Skriv en ny, så kunderne får besked." };
  }
  const recipients = await walletCardCount(business.id);
  if (recipients === 0) return { ok: false, error: "Ingen kunder har kortet i Wallet endnu." };

  // Atomisk: kun hvis ingen anden besked er sendt i mellemtiden (dobbelttryk).
  const sent = await prisma.$transaction(async (tx) => {
    const updated = await tx.business.updateMany({
      where: { id: business.id, newsSentAt: business.newsSentAt ?? null },
      data: { newsText: parsed.value, newsSentAt: new Date() },
    });
    if (updated.count === 0) return false;
    await tx.newsMessage.create({ data: { businessId: business.id, text: parsed.value, recipients } });
    return true;
  });
  if (!sent) return { ok: false, error: "Beskeden er allerede sendt." };

  revalidatePath("/app/beskeder");
  refreshShop(business);
  return { ok: true, recipients };
}

/** Fjern beskeden fra kortene (ingen notifikation; feltet forsvinder bare). */
export async function clearNewsAction(): Promise<NewsResult> {
  const { business } = await requireBusiness();
  await prisma.business.update({ where: { id: business.id }, data: { newsText: null } });
  revalidatePath("/app/beskeder");
  refreshShop(business);
  return { ok: true, recipients: 0 };
}
