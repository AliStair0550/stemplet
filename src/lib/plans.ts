import type { Plan } from "@prisma/client";

export const PRO_PRICE_DKK = 99;

export type PlanLimits = {
  maxCards: number | null; // null = ubegrænset
  maxCustomers: number | null; // samlede kundekort - null = ubegrænset
  campaigns: boolean;
  fullStats: boolean;
  showPoweredBy: boolean;
  ownBrand: boolean;
};

// Gratis er et fuldt brugbart produkt op til 100 kundekort. Loftet er en
// VAEKSTMUR, ikke en straf: eksisterende kunder kan altid stemple og indløse -
// der kan bare ikke oprettes NYE kort ved loftet. Vi varsler allerede ved 80,
// saa opgraderingen sker paa vaerdi (se hvad kunderne har givet dig), ikke tvang.
export const FREE_CUSTOMER_LIMIT = 100;
export const FREE_CUSTOMER_WARN = 80;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxCards: null,
    maxCustomers: FREE_CUSTOMER_LIMIT,
    campaigns: true,
    fullStats: true,
    showPoweredBy: false,
    ownBrand: true,
  },
  PRO: {
    maxCards: null,
    maxCustomers: null,
    campaigns: true,
    fullStats: true,
    showPoweredBy: false,
    ownBrand: true,
  },
};

export function limitsFor(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}

export function canCreateCard(plan: Plan, currentCards: number): boolean {
  const max = PLAN_LIMITS[plan].maxCards;
  return max === null || currentCards < max;
}

/**
 * Kan der oprettes ET nyt kundekort? Loftet tæller ALLE oprettede kort, ikke
 * kun aktive - muren handler om, hvor mange kunder du har taget imod.
 */
export function canCreateCustomer(plan: Plan, totalCustomers: number): boolean {
  const max = PLAN_LIMITS[plan].maxCustomers;
  return max === null || totalCustomers < max;
}
