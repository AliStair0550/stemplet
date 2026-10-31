import { z } from "zod";
import { OFFER_KINDS, OFFER_TITLE_MAX, OFFER_TEXT_MAX } from "./member-offers-shared";

// Butikkens egne tilbud og samarbejdspartnere til kortholdere ("Tilbud og
// fordele"). Ren logik (validering og hvornaar et tilbud vises), saa den kan
// enhedstestes og bruges i baade dashboardet og paa kundens side.

export { OFFER_KINDS, MAX_OFFERS_PER_KIND, OFFER_TITLE_MAX, OFFER_TEXT_MAX, offerPushText } from "./member-offers-shared";
export type { OfferKind } from "./member-offers-shared";
const optionalText = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .transform((v) => v || null)
    .nullable()
    .optional();

/**
 * Butikken skriver ofte bare "dinbutik.dk": https:// saettes paa, og http://
 * goeres til https://. Tomt forbliver tomt.
 */
export function normalizeOfferLink(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https:\/\//i.test(v)) return v;
  if (/^http:\/\//i.test(v)) return `https://${v.slice(7)}`;
  // Andet skema (fx mailto: eller javascript:) roeres ikke og afvises af valideringen.
  if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(v)) return v;
  return `https://${v.replace(/^\/+/, "")}`;
}


export const offerInputSchema = z
  .object({
    kind: z.enum(OFFER_KINDS),
    title: z.string().trim().min(2, "Skriv en overskrift.").max(OFFER_TITLE_MAX, "Overskriften er for lang."),
    text: optionalText(OFFER_TEXT_MAX, "Beskrivelsen er for lang."),
    partnerName: optionalText(60, "Partnerens navn er for langt."),
    link: z
      .string()
      .transform(normalizeOfferLink)
      .pipe(z.string().max(300, "Linket er for langt."))
      .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/i.test(v), "Linket skal starte med https://")
      .transform((v) => v || null)
      .nullable()
      .optional(),
    // "YYYY-MM-DD" fra datofeltet; tomt = uden udloeb.
    endsOn: z
      .string()
      .trim()
      .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Vælg en dato.")
      .optional(),
  })
  .refine((v) => v.kind !== "PARTNER" || !!v.partnerName, { message: "Skriv partnerens navn.", path: ["partnerName"] });

export type OfferInput = z.input<typeof offerInputSchema>;

/** Sidste gyldige oejeblik for en dato: hele dagen med (dansk tid er ok med et par timers margin). */
export function endOfDay(endsOn: string | undefined): Date | null {
  if (!endsOn) return null;
  const d = new Date(`${endsOn}T23:59:59.999Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Vises tilbuddet for kunderne lige nu? */
export function offerIsLive(o: { active: boolean; endsAt: Date | null }, now: Date = new Date()): boolean {
  return o.active && (!o.endsAt || o.endsAt.getTime() > now.getTime());
}
