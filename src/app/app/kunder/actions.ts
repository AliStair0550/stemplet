"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";

/**
 * Slet en kortholder og alle data om dem (GDPR: retten til sletning). Stempler,
 * beloenninger, indloesninger, henvisninger og Wallet-registreringer slettes
 * med (onDelete: Cascade). Kortet i kundens Wallet holder op med at opdatere.
 * Kun butikkens egne kort kan slettes.
 */
export async function deleteCustomerAction(customerCardId: string): Promise<{ ok: boolean; error?: string }> {
  const { business } = await requireBusiness();
  const cc = await prisma.customerCard.findUnique({
    where: { id: customerCardId },
    select: { id: true, card: { select: { businessId: true } } },
  });
  if (!cc || cc.card.businessId !== business.id) {
    return { ok: false, error: "Kunden findes ikke." };
  }
  // deleteMany: slettes kunden to gange (dobbelttryk, to faner), er det ikke en fejl.
  await prisma.customerCard.deleteMany({ where: { id: cc.id } });
  revalidatePath("/app/kunder");
  revalidatePath("/app");
  return { ok: true };
}
