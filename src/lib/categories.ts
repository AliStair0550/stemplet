// Branche pr. butik. Stabile koder i databasen, paene danske labels i UI'et.
// Bruges senere til netvaerks-benchmarking og branche-tilpassede raad. Ikke
// server-only: bruges baade af zod-validering og af klient-formularen.

export const CATEGORY_KEYS = [
  "cafe",
  "coffeebar",
  "bar",
  "restaurant",
  "takeaway",
  "burgerbar",
  "pizzeria",
  "bakery",
  "icecream",
  "barber",
  "salon",
  "massage",
  "other",
] as const;

export type BusinessCategory = (typeof CATEGORY_KEYS)[number];

export const CATEGORY_LABELS: Record<BusinessCategory, string> = {
  cafe: "Café",
  coffeebar: "Kaffebar",
  bar: "Bar",
  restaurant: "Restaurant",
  takeaway: "Take-away",
  burgerbar: "Burgerbar",
  pizzeria: "Pizzeria",
  bakery: "Bageri",
  icecream: "Isbar",
  barber: "Frisør",
  salon: "Skønhed og velvære",
  massage: "Massage og spa",
  other: "Andet",
};

export const BUSINESS_CATEGORIES = CATEGORY_KEYS.map((key) => ({
  key,
  label: CATEGORY_LABELS[key],
}));

export function isBusinessCategory(v: string): v is BusinessCategory {
  return (CATEGORY_KEYS as readonly string[]).includes(v);
}

// Branchen gaettes ud fra stempel-ikonet ved oprettelsen, saa ejeren ikke skal
// vaelge den igen under Indstillinger. Kun tydelige ikoner; kaffekoppen er
// standardikonet og siger intet sikkert, saa den giver ingen branche.
const ICON_CATEGORY: Partial<Record<string, BusinessCategory>> = {
  scissors: "barber",
  comb: "barber",
  mirror: "barber",
  lipstick: "salon",
  nailpolish: "salon",
  lashes: "salon",
  brush: "salon",
  perfume: "salon",
  sparkle: "salon",
  lotus: "massage",
  stones: "massage",
  hand: "massage",
  drop: "massage",
  candle: "massage",
  croissant: "bakery",
  bread: "bakery",
  cake: "bakery",
  cupcake: "bakery",
  donut: "bakery",
  pizza: "pizzeria",
  burger: "burgerbar",
  icecream: "icecream",
  beer: "bar",
  wine: "bar",
  cocktail: "bar",
  hotdog: "takeaway",
  sandwich: "takeaway",
  taco: "takeaway",
  fish: "takeaway",
};

export function categoryFromStampIcon(icon: string | null | undefined): BusinessCategory | null {
  return (icon && ICON_CATEGORY[icon]) || null;
}
