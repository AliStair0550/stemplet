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
