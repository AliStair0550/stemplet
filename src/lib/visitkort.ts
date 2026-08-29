import { z } from "zod";

// ── Visitkort-design: delt model mellem designer (UI + preview), server-action
// (validering) og PDF-eksporten. Alt gemmes som EN JSON paa butikken, saa
// designeren kan vokse uden en migration pr. felt. ────────────────────────────

export type VkTemplate = "split" | "venstre" | "centreret" | "sidebjaelke";
export type VkFont = "sans" | "serif" | "mono";
export type VkCorners = "skarpe" | "afrundede";
export type VkBackContent = "qr" | "stempelkort";
export type VkOrient = "landscape" | "portrait";

// bg = baggrund, text = broedtekst, accent = fremhaevet ord (fx "Få belønninger.").
export type VkColors = { bg: string; text: string; accent: string };

export type VisitkortDesign = {
  template: VkTemplate;
  font: VkFont;
  corners: VkCorners;
  // Fysiske runde hjoerner (die-cut): en trykke-mulighed hos Vistaprint. Vises i
  // preview og noteres i eksporten; selve PDF'en er stadig et almindeligt rektangel.
  dieCut: boolean;
  orientation: VkOrient;
  front: VkColors;
  back: VkColors;
  // Forside: fri tekst. Tomme felter skjules automatisk.
  name: string; // person/kontakt, fx "Ali Al-farhan"
  tagline: string;
  taglineAccent: string; // valgfri hale i accent-farven
  phone: string;
  email: string;
  web: string;
  address: string;
  showLogo: boolean;
  // Bagside: fri tekst.
  backContent: VkBackContent;
  backHeadline: string; // "Saml stempler."
  backHeadlineAccent: string; // "Få belønninger." (accent-farve)
  backLine1: string; // "Direkte i Apple Wallet"
  backLine2: string; // "Ingen app. Ingen tilmelding."
};

export const VK_TEMPLATES: { key: VkTemplate; label: string; note: string }[] = [
  { key: "split", label: "Split", note: "Brand øverst, navn og kontakt nederst" },
  { key: "venstre", label: "Venstre", note: "Alt venstrestillet, samlet" },
  { key: "centreret", label: "Centreret", note: "Alt centreret, roligt udtryk" },
  { key: "sidebjaelke", label: "Sidebjælke", note: "Farvet bjælke med logo" },
];

export const VK_FONTS: { key: VkFont; label: string }[] = [
  { key: "sans", label: "Moderne (sans)" },
  { key: "serif", label: "Elegant (serif)" },
  { key: "mono", label: "Teknisk (mono)" },
];

// Hurtige farvetemaer i designeren. Saetter bg/text/accent paa EN side ad gangen.
export const VK_COLOR_THEMES: { name: string; bg: string; text: string; accentFromBrand?: boolean; accent?: string }[] = [
  { name: "Lys", bg: "#FFFFFF", text: "#1A1A1A", accentFromBrand: true },
  { name: "Sand", bg: "#F4F1EA", text: "#2A1A10", accentFromBrand: true },
  { name: "Mørk", bg: "#1C1917", text: "#F6EEE4", accent: "#E0A56B" },
  { name: "Bordeaux", bg: "#5E2438", text: "#F7E7EE", accent: "#E7B7C6" },
  { name: "Skov", bg: "#1F3A2E", text: "#F3F7F4", accent: "#A8CBB6" },
];

// PDF-familier (react-pdf). "Instrument Sans" indlejres i ruten; serif/mono er
// PDF'ens indbyggede standardfonts og kraever ingen fil. Bold er en egen familie
// for standardfonts, saa vi vaelger familie ud fra vaegt.
export function pdfFamily(font: VkFont, bold = false): string {
  if (font === "serif") return bold ? "Times-Bold" : "Times-Roman";
  if (font === "mono") return bold ? "Courier-Bold" : "Courier";
  return "Instrument Sans"; // har baade 400 og 700 registreret
}

// Preview-fonts (web), valgt taet paa PDF-familierne, saa preview ~ tryk.
export const VK_FONT_CSS: Record<VkFont, string> = {
  sans: "var(--font-instrument-face), 'Instrument Sans', system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', Times, serif",
  mono: "'Courier New', ui-monospace, monospace",
};

// Standard-radius (i mm) for afrundede design-elementer; 0 ved skarpe.
export function cornerRadiusMm(corners: VkCorners): number {
  return corners === "afrundede" ? 3 : 0;
}

export function defaultDesign(b: {
  primaryColor: string;
  textColor: string;
  slug: string;
}): VisitkortDesign {
  const light: VkColors = { bg: "#FFFFFF", text: "#1A1A1A", accent: b.primaryColor };
  return {
    template: "split",
    font: "sans",
    corners: "afrundede",
    dieCut: true,
    orientation: "landscape",
    front: { ...light },
    back: { ...light },
    name: "",
    tagline: "",
    taglineAccent: "",
    phone: "",
    email: "",
    web: `stemplet.alius.dk/k/${b.slug}`,
    address: "",
    showLogo: true,
    backContent: "qr",
    backHeadline: "Saml stempler.",
    backHeadlineAccent: "Få belønninger.",
    backLine1: "Direkte i Apple Wallet",
    backLine2: "Ingen app. Ingen tilmelding.",
  };
}

// Fletter et gemt (evt. delvist/legacy) design sammen med standarden, saa nye
// felter altid har en vaerdi og et gammelt design aldrig kan crashe designeren.
export function mergeDesign(
  base: VisitkortDesign,
  saved: unknown,
): VisitkortDesign {
  if (!saved || typeof saved !== "object") return base;
  const s = saved as Partial<VisitkortDesign>;
  return {
    ...base,
    ...s,
    front: { ...base.front, ...(s.front ?? {}) },
    back: { ...base.back, ...(s.back ?? {}) },
  };
}

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .catch("#1A1A1A");
const colors = z.object({ bg: hex, text: hex, accent: hex });

export const visitkortSchema = z.object({
  template: z.enum(["split", "venstre", "centreret", "sidebjaelke"]),
  font: z.enum(["sans", "serif", "mono"]),
  corners: z.enum(["skarpe", "afrundede"]),
  dieCut: z.boolean(),
  orientation: z.enum(["landscape", "portrait"]),
  front: colors,
  back: colors,
  name: z.string().max(60),
  tagline: z.string().max(80),
  taglineAccent: z.string().max(60),
  phone: z.string().max(40),
  email: z.string().max(80),
  web: z.string().max(80),
  address: z.string().max(120),
  showLogo: z.boolean(),
  backContent: z.enum(["qr", "stempelkort"]),
  backHeadline: z.string().max(60),
  backHeadlineAccent: z.string().max(60),
  backLine1: z.string().max(60),
  backLine2: z.string().max(60),
});
