"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { refreshShop } from "@/lib/shop-refresh";
import { nextNewsAllowedAt, parseNews } from "@/lib/news";

export type NewsResult = { ok: true } | { ok: false; error: string };

/**
 * Send en besked til kundernes kort: teksten laegges paa kortet, og alle kort i
 * Wallet opdateres, saa iPhone viser den som notifikation paa laaseskaermen.
 * Hoejst een besked i doegnet (kontrolleres her, ikke kun i formularen).
 */
export async function sendNewsAction(text: string): Promise<NewsResult> {
  const { business } = await requireBusiness();
  const parsed = parseNews(text);
  if (!parsed.ok) return parsed;
  const wait = nextNewsAllowedAt(business.newsSentAt);
  if (wait) return { ok: false, error: "Du kan sende én besked i døgnet. Prøv igen senere." };

  // Atomisk: kun hvis ingen anden besked er sendt i mellemtiden (dobbelttryk).
  const updated = await prisma.business.updateMany({
    where: { id: business.id, newsSentAt: business.newsSentAt ?? null },
    data: { newsText: parsed.value, newsSentAt: new Date() },
  });
  if (updated.count === 0) return { ok: false, error: "Beskeden er allerede sendt." };

  revalidatePath("/app/beskeder");
  refreshShop(business);
  return { ok: true };
}

/** Fjern beskeden fra kortene (ingen notifikation; feltet forsvinder bare). */
export async function clearNewsAction(): Promise<NewsResult> {
  const { business } = await requireBusiness();
  await prisma.business.update({ where: { id: business.id }, data: { newsText: null } });
  revalidatePath("/app/beskeder");
  refreshShop(business);
  return { ok: true };
}
