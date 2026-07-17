// Delte valgmuligheder for print-materialerne. Bruges baade paa klienten
// (Materialer-siden) og paa serveren (PDF-generering), saa et valgt indeks
// altid betyder det samme begge steder.

export const MATERIAL_HEADLINES = [
  "Scan og få dit stempelkort",
  "Saml stempler, få en belønning",
  "Bliv stamkunde",
  "Scan og kom i gang",
] as const;

/** Sikker opslag af en overskrift ud fra et query-indeks. */
export function headlineFromParam(v: string | null): string {
  const i = Number(v);
  return Number.isInteger(i) && i >= 0 && i < MATERIAL_HEADLINES.length
    ? MATERIAL_HEADLINES[i]
    : MATERIAL_HEADLINES[0];
}
