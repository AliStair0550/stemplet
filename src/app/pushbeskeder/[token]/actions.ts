"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyNewsOptOutToken } from "@/lib/news-optout";
import { pushWalletUpdate } from "@/lib/wallet/apns";

/** Slaa pushbeskeder fra eller til for eet kort. Kortet i Wallet opdateres, saa
 *  beskedfeltet forsvinder (eller kommer igen). */
export async function setNewsOptOutAction(token: string, optOut: boolean): Promise<{ ok: boolean }> {
  const serial = verifyNewsOptOutToken(token);
  if (!serial) return { ok: false };
  const cc = await prisma.customerCard.findUnique({ where: { serial }, select: { id: true, newsOptOut: true } });
  if (!cc) return { ok: false };
  if (cc.newsOptOut !== optOut) {
    await prisma.customerCard.update({ where: { id: cc.id }, data: { newsOptOut: optOut } });
    after(() => pushWalletUpdate(cc.id));
  }
  revalidatePath(`/pushbeskeder/${token}`);
  return { ok: true };
}
