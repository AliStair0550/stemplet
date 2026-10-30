// Delte valgmuligheder for print-materialerne. Bruges baade paa klienten
// (Materialer-siden) og paa serveren (PDF-generering), saa overskriften
// behandles ens begge steder.

// Standard-overskriften, der forudfyldes i feltet.
export const DEFAULT_MATERIAL_HEADLINE = "Scan og få dit stempelkort";

// Maks antal tegn i en overskrift. Holder skiltets layout pænt (ca. to linjer),
// og haandhaeves baade i input-feltet og paa serveren.
export const MATERIAL_HEADLINE_MAX = 40;

// Forslag, butikken kan vaelge at bruge (vises som hurtige valg under feltet).
export const MATERIAL_HEADLINES = [
  "Scan og få dit stempelkort",
  "Saml stempler, få en belønning",
  "Bliv stamkunde",
  "Scan og kom i gang",
] as const;

/** Sikker overskrift ud fra query'en: fri tekst, trimmet og laengde-klampet. */
export function headlineFromParam(v: string | null): string {
  const t = (v ?? "").trim().slice(0, MATERIAL_HEADLINE_MAX);
  return t || DEFAULT_MATERIAL_HEADLINE;
}

// Plakatens fokus: hent kundekortet (alt paa kortet) eller henvis en ven.
export type PosterFocus = "kort" | "henvis";

export const REFERRAL_HEADLINES = [
  "Henvis en ven",
  "Giv en ven rabat",
  "Del os med en ven",
] as const;

/** Fokus ud fra query'en og butikkens funktioner (henvis kraever Henvisninger). */
export function focusFromParam(v: string | null, b: { stampsEnabled: boolean; referralsEnabled: boolean }): PosterFocus {
  return v === "henvis" && b.referralsEnabled ? "henvis" : "kort";
}

const sentence = (t: string) => (t.endsWith(".") ? t : `${t}.`);

/**
 * Linjen under overskriften. Kundekortet naevner alt paa kortet (stempel-
 * beloenningen og/eller henvisningen); henvis-plakaten begge parters beloenning.
 * Beloenningerne kommer faerdigformuleret ("100 kr.", "gratis klip").
 */
export function posterRewardLine(
  focus: PosterFocus,
  i: { stampReward: string | null; friendReward: string | null; referrerReward: string | null },
): string {
  const referral =
    i.friendReward && i.referrerReward
      ? `${sentence(`Din ven får ${i.friendReward}`)} ${sentence(`Du får ${i.referrerReward}`)}`
      : "";
  if (focus === "henvis") return referral;
  if (i.stampReward && i.referrerReward) return `${sentence(i.stampReward)} ${sentence(`Henvis en ven, og få ${i.referrerReward}`)}`;
  return i.stampReward ?? referral;
}

/** Linjen under QR-koden. */
export function posterFootline(focus: PosterFocus): string {
  return focus === "henvis" ? "Scan, og få dit eget link at dele." : "Ingen app. Kun navn og e-mail.";
}

// ── Plakatens gemte valg ─────────────────────────────────────────────
export type PosterSize = "plakat" | "a5" | "skilt";
export type PosterBg = "farve" | "lys" | "billede";
export type PosterSettings = {
  focus: PosterFocus;
  size: PosterSize;
  bg: PosterBg;
  brand: boolean;
  grid: boolean;
  headline: string;
};

export const DEFAULT_POSTER_SETTINGS: PosterSettings = { focus: "kort", size: "plakat", bg: "farve", brand: true, grid: true, headline: "" };

/** Gemte valg fra databasen (eller en klient) renset til gyldige vaerdier. */
export function parsePosterSettings(raw: unknown): PosterSettings {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const pick = <T extends string>(v: unknown, ok: readonly T[], d: T): T => (typeof v === "string" && (ok as readonly string[]).includes(v) ? (v as T) : d);
  const d = DEFAULT_POSTER_SETTINGS;
  return {
    focus: pick(o.focus, ["kort", "henvis"] as const, d.focus),
    size: pick(o.size, ["plakat", "a5", "skilt"] as const, d.size),
    bg: pick(o.bg, ["farve", "lys", "billede"] as const, d.bg),
    brand: typeof o.brand === "boolean" ? o.brand : d.brand,
    grid: typeof o.grid === "boolean" ? o.grid : d.grid,
    headline: typeof o.headline === "string" ? o.headline.trim().replace(/\s+/g, " ").slice(0, MATERIAL_HEADLINE_MAX) : d.headline,
  };
}
