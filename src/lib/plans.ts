import type { Plan } from "@prisma/client";

// Prismodel (Ali 2026-10-30): tre maaneder gratis fra oprettelsen, derefter
// 49 kr. om maaneden ekskl. moms. Alle moduler, ubegraenset antal kortholdere,
// ingen binding. Faktureres manuelt (Billy), indtil der er et betalingssystem.
export const PRO_PRICE_DKK = 49;
export const TRIAL_MONTHS = 3;
/** Ejeren varsles saa mange dage foer, de gratis maaneder slutter. */
export const TRIAL_WARN_DAYS = 14;

/** Sidste oejeblik i proeveperioden: tre kalendermaaneder efter oprettelsen. */
export function trialEndsAt(createdAt: Date): Date {
  const d = new Date(createdAt);
  d.setUTCMonth(d.getUTCMonth() + TRIAL_MONTHS);
  return d;
}

/** Hele dage tilbage af proeveperioden (0 = slutter i dag eller er slut). */
export function trialDaysLeft(createdAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((trialEndsAt(createdAt).getTime() - now.getTime()) / 86_400_000));
}

// Kun det, der faktisk haandhaeves: kunde-loftet og Stemplet-maerket. Alle
// oevrige funktioner (kampagner, fuld statistik, eget brand) er ens paa begge
// planer, saa de behoever ingen gate.
export type PlanLimits = {
  maxCustomers: number | null; // samlede kundekort - null = ubegraenset
  showPoweredBy: boolean;
};

// Ubegraenset antal kortholdere paa begge planer (en del af prismodellen).
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxCustomers: null, showPoweredBy: false },
  PRO: { maxCustomers: null, showPoweredBy: false },
};

/**
 * Kan der oprettes ET nyt kundekort? Loftet tæller ALLE oprettede kort, ikke
 * kun aktive - muren handler om, hvor mange kunder du har taget imod.
 */
export function canCreateCustomer(plan: Plan, totalCustomers: number): boolean {
  const max = PLAN_LIMITS[plan].maxCustomers;
  return max === null || totalCustomers < max;
}
