import { z } from "zod";

// ── Visitkort-design: delt model mellem designer (UI + preview), server-action
// (validering) og PDF-eksporten. Alt gemmes som EN JSON paa butikken, saa
// designeren kan vokse uden en migration pr. felt. ────────────────────────────

export type VkTemplate = "venstre" | "centreret" | "sidebjaelke";
export type VkFont = "sans" | "serif" | "mono";
export type VkCorners = "skarpe" | "afrundede";
export type VkBackContent = "stempelkort" | "qr";
export type VkOrient = "landscape" | "portrait";

export type VkColors = { bg: string; text: string };

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
  backContent: VkBackContent;
  // Kontaktinfo paa forsiden. Tomme felter skjules automatisk.
  tagline: string;
  phone: string;
  email: string;
  web: string;
  address: string;
  showLogo: boolean;
};

export const VK_TEMPLATES: { key: VkTemplate; label: string; note: string }[] = [
  { key: "venstre", label: "Venstre", note: "Logo og info venstrestillet" },
  { key: "centreret", label: "Centreret", note: "Alt centreret, roligt udtryk" },
  { key: "sidebjaelke", label: "Sidebjælke", note: "Farvet bjælke med logo" },
];

export const VK_FONTS: { key: VkFont; label: string }[] = [
  { key: "sans", label: "Moderne (sans)" },
  { key: "serif", label: "Elegant (serif)" },
  { key: "mono", label: "Teknisk (mono)" },
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
  return {
    template: "venstre",
    font: "sans",
    corners: "afrundede",
    dieCut: false,
    orientation: "landscape",
    front: { bg: b.primaryColor, text: b.textColor },
    back: { bg: b.primaryColor, text: b.textColor },
    backContent: "stempelkort",
    tagline: "",
    phone: "",
    email: "",
    web: `stemplet.alius.dk/k/${b.slug}`,
    address: "",
    showLogo: true,
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
  .catch("#2A1A10");

export const visitkortSchema = z.object({
  template: z.enum(["venstre", "centreret", "sidebjaelke"]),
  font: z.enum(["sans", "serif", "mono"]),
  corners: z.enum(["skarpe", "afrundede"]),
  dieCut: z.boolean(),
  orientation: z.enum(["landscape", "portrait"]),
  front: z.object({ bg: hex, text: hex }),
  back: z.object({ bg: hex, text: hex }),
  backContent: z.enum(["stempelkort", "qr"]),
  tagline: z.string().max(80),
  phone: z.string().max(40),
  email: z.string().max(80),
  web: z.string().max(80),
  address: z.string().max(120),
  showLogo: z.boolean(),
});
