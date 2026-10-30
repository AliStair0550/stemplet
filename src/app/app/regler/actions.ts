"use server";

import { revalidatePath } from "next/cache";
import { refreshShop } from "@/lib/shop-refresh";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { parseCardName } from "@/lib/card-name";

export type Feature = "stempler" | "henvisninger";

/**
 * Slaa en funktion paa kortet til eller fra (Regler). Mindst een funktion skal
 * vaere slaaet til, ellers har kortet intet indhold. Intet slettes: stempler,
 * koder og ventende beloenninger ligger klar, hvis funktionen slaas til igen.
 */
export async function setFeatureAction(formData: FormData) {
  const { business } = await requireBusiness();
  const feature = formData.get("feature");
  const on = formData.get("on") === "1";
  if (feature !== "stempler" && feature !== "henvisninger") redirect("/app/regler");

  const next = {
    stampsEnabled: feature === "stempler" ? on : business.stampsEnabled,
    referralsEnabled: feature === "henvisninger" ? on : business.referralsEnabled,
  };
  if (!next.stampsEnabled && !next.referralsEnabled) redirect(`/app/regler?f=${feature}`);

  if (next.stampsEnabled !== business.stampsEnabled || next.referralsEnabled !== business.referralsEnabled) {
    await prisma.business.update({ where: { id: business.id }, data: next });
    revalidatePath("/app", "layout");
    // Butikssiden (cachet) og kortene i kundernes Wallet foelger funktionerne.
    refreshShop(business);
  }
  redirect(`/app/regler?f=${on ? feature : next.stampsEnabled ? "stempler" : "henvisninger"}`);
}

/** Kortets korte navn til knappen paa kundesiden ("Hent dit X-kort"); tomt = automatisk. */
export async function saveCardNameAction(input: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { business } = await requireBusiness();
  const name = parseCardName(input);
  if (!name.ok) return { ok: false, error: name.error };
  await prisma.business.update({ where: { id: business.id }, data: { cardName: name.value } });
  revalidatePath("/app/regler");
  // Navnet staar kun i knappen paa butikssiden, ikke paa Wallet-kortet.
  refreshShop(business, { wallet: false });
  return { ok: true };
}
