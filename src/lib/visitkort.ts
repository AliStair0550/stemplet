
// ── Visitkort-design: delt model mellem designer (UI + preview), server-action
// (validering) og PDF-eksporten. Alt gemmes som EN JSON paa butikken, saa
// designeren kan vokse uden en migration pr. felt. ────────────────────────────

export type VkTemplate =
  | "split"
  | "venstre"
  | "hoejre"
  | "centreret"
  | "topbaand"
  | "sidebjaelke";
export type VkFont = "sans" | "serif" | "mono";
export type VkCorners = "skarpe" | "afrundede";
export type VkBackContent = "qr" | "stempelkort";
export type VkOrient = "landscape" | "portrait";
// Baggrund: flad farve, eller farve + fliselagte stempel-ikoner (samme
// brandede look som kortets landingsside).
export type VkBackground = "flad" | "ikoner";

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
  // Baggrundsstil, gaelder begge sider (farve tages fra hver sides bg/text).
  background: VkBackground;
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
  logoScale: number; // 1 = standard; styrer logoets stoerrelse paa kortet
  qrScale: number; // 1 = standard; klampet til et sikkert, scanbart interval
  // Fed/normal pr. tekstelement.
  nameBold: boolean;
  taglineBold: boolean;
  // Bagside: fri tekst.
  backContent: VkBackContent;
  backHeadline: string; // "Saml stempler."
  backHeadlineAccent: string; // "Få belønninger." (accent-farve)
  backLine1: string; // "Direkte i Apple Wallet"
  backLine2: string; // "Ingen app. Ingen tilmelding."
  headlineBold: boolean;
  line1Bold: boolean;
  line2Bold: boolean;
};

export const VK_TEMPLATES: { key: VkTemplate; label: string; note: string }[] = [
  { key: "split", label: "Split", note: "Brand øverst, kontakt nederst" },
  { key: "venstre", label: "Venstre", note: "Alt venstrestillet, samlet" },
  { key: "hoejre", label: "Højre", note: "Alt højrestillet, samlet" },
  { key: "centreret", label: "Centreret", note: "Alt centreret, roligt udtryk" },
  { key: "topbaand", label: "Topbånd", note: "Farvet bånd med brand øverst" },
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

// Enkelt "flise" med stempel-ikonet til baggrundsteksturen (samme look som
// kortets landingsside). Bruges som CSS background-image i preview; PDF'en
// rasteriserer en tilsvarende baggrund. markup = STAMP_ICON_PATHS[icon].
export function iconTileDataUri(markup: string, stroke: string): string {
  const t = 118;
  const g = (x: number, y: number) =>
    `<g transform='translate(${x},${y}) scale(1.5) rotate(-8)'>${markup}</g>`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${t}' height='${t}' viewBox='0 0 ${t} ${t}'>` +
    `<g fill='none' stroke='${stroke}' stroke-opacity='0.08' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'>` +
    `${g(16, 18)}${g(75, 78)}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
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
    // Standard: kantede hjoerner. Kan afrundes (baade design-elementer og fysiske
    // hjoerner) via een kontrol; slaar igennem i live-preview og PDF.
    corners: "skarpe",
    dieCut: false,
    orientation: "landscape",
    background: "flad",
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
    logoScale: 1,
    qrScale: 1,
    nameBold: true,
    taglineBold: false,
    backContent: "qr",
    backHeadline: "Saml stempler.",
    backHeadlineAccent: "Få belønninger.",
    backLine1: "Direkte i Apple Wallet",
    backLine2: "Ingen app. Ingen tilmelding.",
    headlineBold: true,
    line1Bold: true,
    line2Bold: false,
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

