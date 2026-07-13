// Brand-hjælpere for kundekortene: stempel-ikoner, farver, kontrast.
// Ren logik uden server-afhængigheder, så den kan bruges på klienten.

export const DEFAULT_PRIMARY = "#061C3D";
export const DEFAULT_TEXT = "#FFFFFF";

export type StampIconKey =
  | "coffee"
  | "scissors"
  | "croissant"
  | "pizza"
  | "burger"
  | "beer"
  | "icecream"
  | "wine"
  | "heart"
  | "star"
  | "custom";

export const STAMP_ICONS: { key: StampIconKey; label: string }[] = [
  { key: "coffee", label: "Kaffekop" },
  { key: "scissors", label: "Saks" },
  { key: "croissant", label: "Croissant" },
  { key: "pizza", label: "Pizza" },
  { key: "burger", label: "Burger" },
  { key: "beer", label: "Øl" },
  { key: "icecream", label: "Is" },
  { key: "wine", label: "Vin" },
  { key: "heart", label: "Hjerte" },
  { key: "star", label: "Stjerne" },
  { key: "custom", label: "Prik" },
];

export function isStampIcon(v: string): v is StampIconKey {
  return STAMP_ICONS.some((i) => i.key === v);
}

// Faerdige, gennemtaenkte farvetemaer, saa alle kan lave et flot kort i eet klik.
export const CARD_THEMES: { name: string; primary: string; text: string }[] = [
  { name: "Espresso", primary: "#2A1A10", text: "#F6EEE4" },
  { name: "Skov", primary: "#1F3A2E", text: "#F3F7F4" },
  { name: "Midnat", primary: "#101F33", text: "#EAF0F8" },
  { name: "Terrakotta", primary: "#7A3B2A", text: "#FBEDE6" },
  { name: "Vin", primary: "#5E2438", text: "#F7E7EE" },
  { name: "Kul", primary: "#1A1A1A", text: "#F5F3EF" },
  { name: "Hav", primary: "#123B47", text: "#E6F3F6" },
  { name: "Sand", primary: "#E8E2D6", text: "#2A2118" },
];

const HEX_RE = /^#([0-9a-fA-F]{6})$/;

export function isHex(v: string): boolean {
  return HEX_RE.test(v);
}

export function normalizeHex(v: string, fallback = DEFAULT_PRIMARY): string {
  const trimmed = v.trim();
  if (isHex(trimmed)) return trimmed.toUpperCase();
  if (/^#([0-9a-fA-F]{3})$/.test(trimmed)) {
    const [r, g, b] = trimmed.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Vælg læsbar tekstfarve (ink eller hvid) oven på en baggrundsfarve. */
export function contrastText(bgHex: string): "#FFFFFF" | "#1A1A1A" {
  const { r, g, b } = hexToRgb(bgHex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1A1A1A" : "#FFFFFF";
}

/** Relativ luminans (WCAG 2.1). */
function relLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG-kontrastforhold mellem to farver (1 til 21). Højere er bedre. */
export function contrastRatio(aHex: string, bHex: string): number {
  const la = relLuminance(aHex);
  const lb = relLuminance(bHex);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Er tekst-på-kort læsbar? AA for stor tekst er 3:1; vi kræver 3.5 som margin. */
export function isCardReadable(primaryHex: string, textHex: string): boolean {
  return contrastRatio(primaryHex, textHex) >= 3.5;
}

/** Let variation af en farve, til gradient/skygge på kortet. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const f = (c: number) =>
    amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
  const toHex = (n: number) => clamp(f(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
