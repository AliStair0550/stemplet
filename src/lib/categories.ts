// Branche pr. butik. Stabile koder i databasen, paene danske labels i UI'et.
// Bruges senere til netvaerks-benchmarking og branche-tilpassede raad. Ikke
// server-only: bruges baade af zod-validering og af klient-formularen.

export const CATEGORY_KEYS = [
  "cafe",
  "restaurant",
  "bakery",
  "barber",
  "salon",
  "retail",
  "fitness",
  "other",
] as const;

export type BusinessCategory = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  cafe: "Café",
  restaurant: "Restaurant eller spisested",
  bakery: "Bageri",
  barber: "Frisør eller barber",
  salon: "Skønhed og velvære",
  retail: "Butik eller detailhandel",
  fitness: "Fitness og træning",
  other: "Andet",
};

export const BUSINESS_CATEGORIES = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));

export function isBusinessCategory(v: string): v is BusinessCategory {
  return (CATEGORY_KEYS as readonly string[]).includes(v);
}

export function categoryLabel(key: string | null | undefined): string | null {
  return key && isBusinessCategory(key) ? CATEGORY_LABELS[key] : null;
}
