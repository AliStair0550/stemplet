"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/** Slaar Stemplet til for en butik, der indtil nu kun har haft Henvisninger. */
export async function enableStampsAction() {
  const { business } = await requireBusiness();
  if (!business.stampsEnabled) {
    await prisma.business.update({ where: { id: business.id }, data: { stampsEnabled: true } });
    revalidatePath("/app", "layout");
    // Stemplets QR-side er cachet (ISR) og sendte videre til henvisningssiden.
    revalidatePath(`/k/${business.slug}`);
  }
  // Videre til designet, saa stempelkortet saettes op med det samme.
  redirect("/app/regler?f=stempler");
}
