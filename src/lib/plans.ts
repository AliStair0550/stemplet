import type { Plan } from "@prisma/client";

export const PRO_PRICE_DKK = 99;

export type PlanLimits = {
  maxCards: number | null; // null = ubegrænset
  maxActiveCustomers: number | null;
  campaigns: boolean;
  fullStats: boolean;
  showPoweredBy: boolean;
  ownBrand: boolean;
};

// Gratis giver ALLE funktioner (eget brand, kampagner, fuld statistik) op til
// 25 aktive kunder. Man overgaar til Pro, naar man passerer 25 kunder.
export const FREE_CUSTOMER_LIMIT = 25;

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    maxCards: null,
    maxActiveCustomers: FREE_CUSTOMER_LIMIT,
    campaigns: true,
    fullStats: true,
    showPoweredBy: false,
    ownBrand: true,
  },
  PRO: {
    maxCards: null,
    maxActiveCustomers: null,
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

export function withinCustomerLimit(plan: Plan, activeCustomers: number): boolean {
  const max = PLAN_LIMITS[plan].maxActiveCustomers;
  return max === null || activeCustomers < max;
}
