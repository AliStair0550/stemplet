// Brand-hjaelpere for kundekortene: stempel-ikoner, farver, kontrast.
// Ren logik uden server-afhaengigheder, saa den kan bruges paa klienten.

export const DEFAULT_PRIMARY = "#061C3D";
export const DEFAULT_TEXT = "#FFFFFF";

export type StampIconKey =
  | "coffee"
  | "scissors"
  | "croissant"
  | "heart"
  | "star"
  | "custom";

export const STAMP_ICONS: { key: StampIconKey; label: string }[] = [
  { key: "coffee", label: "Kaffekop" },
  { key: "scissors", label: "Saks" },
  { key: "croissant", label: "Croissant" },
  { key: "heart", label: "Hjerte" },
  { key: "star", label: "Stjerne" },
  { key: "custom", label: "Prik" },
];

export function isStampIcon(v: string): v is StampIconKey {
  return STAMP_ICONS.some((i) => i.key === v);
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

/** Vaelg laesbar tekstfarve (ink eller hvid) oven paa en baggrundsfarve. */
export function contrastText(bgHex: string): "#FFFFFF" | "#1A1A1A" {
  const { r, g, b } = hexToRgb(bgHex);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "#1A1A1A" : "#FFFFFF";
}

/** Let variation af en farve, til gradient/skygge paa kortet. */
export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const f = (c: number) =>
    amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
  const toHex = (n: number) => clamp(f(n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
