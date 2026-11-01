"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { cardTitle } from "@/lib/brand";
import { cardholderDeletedEmail } from "@/lib/emails";
import { sendEmail } from "@/lib/send-email";
import { captureServerError } from "@/lib/sentry";

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
    select: { id: true, serial: true, contactEmail: true, card: { select: { businessId: true } } },
  });
  if (!cc || cc.card.businessId !== business.id) {
    return { ok: false, error: "Kunden findes ikke." };
  }
  // deleteMany: slettes kunden to gange (dobbelttryk, to faner), er det ikke en fejl.
  const res = await prisma.customerCard.deleteMany({ where: { id: cc.id } });
  if (res.count > 0) {
    // Spor i "Seneste handlinger" (kun kortnummeret, ingen persondata).
    await prisma.auditLog
      .create({ data: { businessId: business.id, action: "DELETE_CUSTOMER", detail: { serial: cc.serial } } })
      .catch(() => {});
    // Kvittering til kunden, med hvordan kortet fjernes fra Wallet.
    if (cc.contactEmail) {
      try {
        const shopName = cardTitle(business);
        const mail = cardholderDeletedEmail(shopName);
        await sendEmail({ to: cc.contactEmail, ...mail, fromName: shopName });
      } catch (e) {
        captureServerError(e, { route: "kunder/slet", businessId: business.id });
      }
    }
  }
  revalidatePath("/app/kunder");
  revalidatePath("/app");
  return { ok: true };
}
