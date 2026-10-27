"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveReferralRule, ReferralError } from "@/lib/referral";

type Result = { ok: true } | { ok: false; error: string };

const rewardType = z.enum(["AMOUNT", "STAMPS", "SERVICE"]);
const optionalInt = (msg: string) =>
  z
    .union([z.literal(""), z.coerce.number({ message: msg }).int(msg).min(0, msg).max(100_000, msg)])
    .transform((v) => (v === "" ? null : v));

const ruleSchema = z.object({
  newCustomerRewardType: rewardType,
  newCustomerRewardValue: z.string().trim().min(1, "Skriv hvad den nye kunde får.").max(80),
  referrerRewardType: rewardType,
  referrerRewardValue: z.string().trim().min(1, "Skriv hvad ambassadøren får.").max(80),
  minPurchaseKr: optionalInt("Minimumskøb skal være et helt beløb i kr."),
  maxReferralsPerMonth: optionalInt("Grænsen skal være et helt tal."),
  rewardExpiryDays: z.coerce
    .number({ message: "Skriv hvor mange dage belønninger gælder." })
    .int("Skriv hvor mange dage belønninger gælder.")
    .min(1, "Belønninger skal gælde i mindst 1 dag.")
    .max(3650, "Belønninger kan højst gælde i 10 år."),
  termsLine: z.string().trim().max(120, "Betingelserne må højst være 120 tegn."),
  bookingUrl: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https?:\/\/\S+$/i.test(v), "Booking-linket skal starte med https://"),
});

export type RuleInput = z.input<typeof ruleSchema>;

/** Butikkens egne henvisningsregler og booking-link (fanen Henvisninger). */
export async function saveReferralSettings(input: RuleInput): Promise<Result> {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) return { ok: false, error: "Henvisninger er ikke slået til." };
  const parsed = ruleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Tjek felterne." };
  }
  const d = parsed.data;
  try {
    await saveReferralRule(business.id, {
      newCustomerRewardType: d.newCustomerRewardType,
      newCustomerRewardValue: d.newCustomerRewardValue,
      referrerRewardType: d.referrerRewardType,
      referrerRewardValue: d.referrerRewardValue,
      minPurchaseKr: d.minPurchaseKr,
      maxReferralsPerMonth: d.maxReferralsPerMonth,
      rewardExpiryDays: d.rewardExpiryDays,
      termsLine: d.termsLine || null,
    });
  } catch (e) {
    if (e instanceof ReferralError) {
      return { ok: false, error: "Beløb og stempler skal være et helt tal over 0." };
    }
    throw e;
  }
  await prisma.business.update({
    where: { id: business.id },
    data: { bookingUrl: d.bookingUrl || null },
  });
  revalidatePath("/app/henvisninger");
  revalidatePath("/app/henvisninger/indstillinger");
  revalidatePath("/app/regler");
  revalidatePath(`/henvisninger/${business.slug}`);
  return { ok: true };
}

/** Slaar Henvisninger til for en butik, der indtil nu kun har haft Stemplet. */
export async function enableReferralsAction() {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) {
    await prisma.business.update({ where: { id: business.id }, data: { referralsEnabled: true } });
    revalidatePath("/app", "layout");
  }
  // Uden regel viser Overblik "Saet beloenninger op"; ellers arbejdslisten.
  redirect("/app/henvisninger/indstillinger");
}
