// Brand-hjælpere for kundekortene: stempel-ikoner, farver, kontrast.
// Ren logik uden server-afhængigheder, så den kan bruges på klienten.

// Espresso: foerste indbyggede tema, varmt og laesbart. Bruges som reserve, saa
// et kort uden eksplicit farve stadig lander paa det nye brand.
export const DEFAULT_PRIMARY = "#2A1A10";
export const DEFAULT_TEXT = "#F6EEE4";

export type StampIconKey =
  | "coffee"
  | "croissant"
  | "cupcake"
  | "pizza"
  | "burger"
  | "icecream"
  | "beer"
  | "wine"
  | "cocktail"
  | "scissors"
  | "sparkle"
  | "flower"
  | "leaf"
  | "heart"
  | "star"
  | "crown"
  | "custom";

// Raekkefoelgen styrer designerens ikon-gitter: foerst mad og drikke, saa
// skoenhed og butik, til sidst de generelle. Bredt nok til alle vores brancher,
// saa hver forretning kan finde et ikon der passer.
export const STAMP_ICONS: { key: StampIconKey; label: string }[] = [
  { key: "coffee", label: "Kaffekop" },
  { key: "croissant", label: "Croissant" },
  { key: "cupcake", label: "Cupcake" },
  { key: "pizza", label: "Pizza" },
  { key: "burger", label: "Burger" },
  { key: "icecream", label: "Is" },
  { key: "beer", label: "Øl" },
  { key: "wine", label: "Vin" },
  { key: "cocktail", label: "Cocktail" },
  { key: "scissors", label: "Saks" },
  { key: "sparkle", label: "Glimt" },
  { key: "flower", label: "Blomst" },
  { key: "leaf", label: "Blad" },
  { key: "heart", label: "Hjerte" },
  { key: "star", label: "Stjerne" },
  { key: "crown", label: "Krone" },
  { key: "custom", label: "Prik" },
];

export function isStampIcon(v: string): v is StampIconKey {
  return STAMP_ICONS.some((i) => i.key === v);
}

// Seks indbyggede temaer, hvert med sit eget navn: gennemtaenkte farvepar, saa
// enhver kan lave et flot, laesbart kort i eet klik. Raekkefoelgen er bevidst:
// varm -> koel, med en enkelt lys i bunden til dem der vil have et lyst kort.
// Ud over disse kan man altid vaelge sin egen farve (custom).
export type CardTheme = {
  name: string;
  primary: string;
  text: string;
};

export const CARD_THEMES: CardTheme[] = [
  { name: "Espresso", primary: "#2A1A10", text: "#F6EEE4" },
  { name: "Terrakotta", primary: "#8A3B24", text: "#FBEDE6" },
  { name: "Skov", primary: "#1F3A2E", text: "#F3F7F4" },
  { name: "Midnat", primary: "#101F33", text: "#EAF0F8" },
  { name: "Bordeaux", primary: "#5E2438", text: "#F7E7EE" },
  { name: "Sand", primary: "#E8E2D6", text: "#3B2F1E" },
];

/** Navnet paa et indbygget tema der matcher farverne, ellers null (custom). */
export function themeNameFor(primary: string, text: string): string | null {
  const p = primary.toUpperCase();
  const t = text.toUpperCase();
  return (
    CARD_THEMES.find(
      (th) => th.primary.toUpperCase() === p && th.text.toUpperCase() === t,
    )?.name ?? null
  );
}

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
