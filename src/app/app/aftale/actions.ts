"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Ejeren godkender Pro-aftalen. Logges med tidspunkt + bruger. Idempotent:
 *  kun den FOERSTE godkendelse taeller (senere klik aendrer ikke tidsstemplet). */
export async function approveProAgreement(): Promise<{ ok: boolean }> {
  const { business, userId } = await requireBusiness();
  await prisma.business.updateMany({
    where: { id: business.id, proApprovedAt: null },
    data: { proApprovedAt: new Date(), proApprovedById: userId },
  });
  revalidatePath("/app/aftale");
  revalidatePath("/app");
  return { ok: true };
}
