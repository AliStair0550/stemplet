// Delte tekster og smaa hjaelpere til "Gør QR-koden klar"-print (visitkort + A4).
// Bruges baade paa klienten (forhaandsvisning) og serveren (PDF), saa de to
// altid viser det samme.

export const QR_PRINT_HEADLINE = "Få vores digitale stempelkort";
export const QR_PRINT_HELPER = "Scan med kameraet, ingen app eller tilmelding";
// Diskret, sekundaer Stemplet-afsender.
export const QR_PRINT_BRAND = "Lavet med Stemplet";

export type QrFormat = "visitkort" | "a4";
export type QrOrient = "portrait" | "landscape";

export function isQrFormat(v: string): v is QrFormat {
  return v === "visitkort" || v === "a4";
}

export function normalizeOrient(
  v: string | null | undefined,
  fallback: QrOrient,
): QrOrient {
  return v === "portrait" || v === "landscape" ? v : fallback;
}

// Standard-retning pr. format: visitkort er liggende (85x55), plakaten staaende.
export function defaultOrient(format: QrFormat): QrOrient {
  return format === "visitkort" ? "landscape" : "portrait";
}

// Klip et for langt navn, saa hverken kort eller plakat braekker layoutet.
export function clampName(name: string, max: number): string {
  const n = name.trim();
  if (n.length <= max) return n;
  return n.slice(0, max - 1).trimEnd() + "…";
}
