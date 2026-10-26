"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { saveReferralRule, ReferralError } from "@/lib/referral";

type Result = { ok: true } | { ok: false; error: string };

const rewardType = z.enum(["AMOUNT", "STAMPS", "SERVICE"]);
const optionalInt = z
  .union([z.literal(""), z.coerce.number().int().min(0).max(100_000)])
  .transform((v) => (v === "" ? null : v));

const ruleSchema = z.object({
  newCustomerRewardType: rewardType,
  newCustomerRewardValue: z.string().trim().min(1).max(80),
  referrerRewardType: rewardType,
  referrerRewardValue: z.string().trim().min(1).max(80),
  minPurchaseKr: optionalInt,
  maxReferralsPerMonth: optionalInt,
  rewardExpiryDays: z.coerce.number().int().min(1).max(3650),
  termsLine: z.string().trim().max(120),
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
  revalidatePath(`/henvisninger/${business.slug}`);
  return { ok: true };
}
