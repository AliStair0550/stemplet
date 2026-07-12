import type { Plan } from "@prisma/client";

export const PRO_PRICE_DKK = 99;

// Gratis er et fuldt brugbart produkt op til 100 kundekort. Loftet er en
// VAEKSTMUR, ikke en straf: eksisterende kunder kan altid stemple og indløse -
// der kan bare ikke oprettes NYE kort ved loftet. Vi varsler allerede ved 80,
// saa opgraderingen sker paa vaerdi (se hvad kunderne har givet dig), ikke tvang.
export const FREE_CUSTOMER_LIMIT = 100;
export const FREE_CUSTOMER_WARN = 80;

// Kun det, der faktisk haandhaeves: kunde-loftet og Stemplet-maerket. Alle
// oevrige funktioner (kampagner, fuld statistik, eget brand) er ens paa begge
// planer, saa de behoever ingen gate.
export type PlanLimits = {
  maxCustomers: number | null; // samlede kundekort - null = ubegraenset
  showPoweredBy: boolean;
};

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: { maxCustomers: FREE_CUSTOMER_LIMIT, showPoweredBy: false },
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
