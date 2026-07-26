"use server";

import type { MarketingStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSuperadminEmail, isAdminUnlocked } from "@/lib/admin";
import { MARKETING_STATUSES } from "@/lib/marketing";

// Alle handlinger er superadmin-gated paa serveren (ikke kun i UI'et) og kraever,
// at admin er laast op med koden (naar ADMIN_ACCESS_CODE er sat). Samme moenster
// som butiks-handlingerne i /admin.
async function requireAdmin(): Promise<string> {
  const admin = await getSuperadminEmail();
  if (!admin) throw new Error("Ikke tilladt");
  if (!(await isAdminUnlocked())) throw new Error("Admin er laast");
  return admin;
}

/** Saet status manuelt: Ny / Kontaktet / Ikke relevant. */
export async function setMarketingStatus(
  id: string,
  status: MarketingStatus,
): Promise<void> {
  await requireAdmin();
  if (!MARKETING_STATUSES.includes(status)) throw new Error("Ugyldig status");
  await prisma.marketingSignup.update({ where: { id }, data: { status } });
  revalidatePath("/admin/marketing");
}

/** Gem/ryd et frit notefelt pr. tilmelding. */
export async function setMarketingNote(
  _prev: { error: string | null; ok?: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok?: boolean }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Ikke tilladt." };
  }
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Mangler tilmelding." };
  const raw = String(formData.get("note") ?? "").trim();
  if (raw.length > 2000) return { error: "Noten er for lang (maks 2000 tegn)." };
  await prisma.marketingSignup.update({
    where: { id },
    data: { note: raw || null },
  });
  revalidatePath("/admin/marketing");
  return { error: null, ok: true };
}
