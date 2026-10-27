"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { WALLET_ENABLED } from "@/lib/env";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";

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
    // Kundesiderne er cachet: /k sender videre til henvisningssiden uden stempler.
    revalidatePath(`/k/${business.slug}`);
    revalidatePath(`/henvisninger/${business.slug}`);
    // Kortene i kundernes Wallet faar de nye felter via en stille opdatering.
    if (WALLET_ENABLED) {
      after(async () => {
        const { pushAllWalletPasses } = await import("@/lib/wallet/build");
        await pushAllWalletPasses({ businessId: business.id }).catch(() => {});
      });
    }
  }
  redirect(`/app/regler?f=${on ? feature : next.stampsEnabled ? "stempler" : "henvisninger"}`);
}
