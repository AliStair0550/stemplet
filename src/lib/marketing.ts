import type { MarketingStatus } from "@prisma/client";

// Laesbare etiketter + hjaelpere til "Hold mig orienteret". Zod-valideringen
// ligger i lib/marketing-schema.ts, saa admin-tabellen (klient) kan bruge disse
// UDEN at traekke zod ind i klient-bundlen.

/** Danske etiketter til status-dropdownen i admin. Eneste kilde. */
export const MARKETING_STATUS_LABELS: Record<MarketingStatus, string> = {
  NEW: "Ny",
  CONTACTED: "Kontaktet",
  NOT_RELEVANT: "Ikke relevant",
};

export const MARKETING_STATUSES: MarketingStatus[] = [
  "NEW",
  "CONTACTED",
  "NOT_RELEVANT",
];

/** Laesbar kilde: "Forside", "Footer" eller branchenavnet udledt af slug'en. */
export function marketingSourceLabel(source: string): string {
  if (source === "forside") return "Forside";
  if (source === "footer") return "Footer";
  const m = source.match(/^\/stempelkort-til-(.+)$/);
  if (m && m[1]) return m[1].charAt(0).toUpperCase() + m[1].slice(1);
  return source;
}
