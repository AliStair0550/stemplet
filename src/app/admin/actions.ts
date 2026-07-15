"use server";

import type { Plan } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSuperadminEmail } from "@/lib/admin";
import { DEMO_SLUG } from "@/lib/demo";

// Alle admin-handlinger er superadmin-gated paa serveren (ikke kun i UI'et), saa
// de ikke kan kaldes af andre. Fejler gaten, kastes en fejl og intet aendres.
async function requireAdmin(): Promise<string> {
  const admin = await getSuperadminEmail();
  if (!admin) throw new Error("Ikke tilladt");
  return admin;
}

const PLANS: Plan[] = ["FREE", "PRO"];

/** Skift en butiks plan (FREE/PRO). Reversibelt. */
export async function setPlan(businessId: string, plan: Plan): Promise<void> {
  await requireAdmin();
  if (!PLANS.includes(plan)) throw new Error("Ugyldig plan");
  await prisma.business.update({ where: { id: businessId }, data: { plan } });
  revalidatePath("/admin");
}

/**
 * Slet en butik og ALT dens data (kort, kunder, stempler via cascade).
 * DESTRUKTIVT. Demo-butikken er spaerret, den er rygraden i "Prøv det selv".
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  await requireAdmin();
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  if (!b) return;
  if (b.slug === DEMO_SLUG) {
    throw new Error("Demo-butikken kan ikke slettes. Nulstil dens kort i stedet.");
  }
  await prisma.business.delete({ where: { id: businessId } });
  revalidatePath("/admin");
}

/**
 * Nulstil demo-kortene: sletter alle kundekort (og deres stempler via cascade)
 * paa demo-butikken, saa "35 kunder"-tallet nulstilles. Rammer KUN demoen, aldrig
 * en rigtig butik.
 */
export async function clearDemoCards(): Promise<void> {
  await requireAdmin();
  await prisma.customerCard.deleteMany({
    where: { card: { business: { slug: DEMO_SLUG } } },
  });
  revalidatePath("/admin");
}
