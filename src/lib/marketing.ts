import { z } from "zod";
import type { MarketingStatus } from "@prisma/client";

// "Hold mig orienteret"-tilmelding: validering + laesbare etiketter. Delt mellem
// API-ruten (server) og admin-siden, saa der er een kilde til feltgraenser og
// labels.

// Fornuftige loft, saa felterne ikke kan misbruges til at fylde databasen. Navn
// og butiksnavn er valgfrie (footer-varianten har kun mail). Mailen normaliseres
// (trim + lowercase), saa dubletter fanges af email-unik'en.
export const marketingSignupSchema = z.object({
  name: z.string().trim().max(80, "Navnet er for langt").optional(),
  storeName: z.string().trim().max(80, "Butiksnavnet er for langt").optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Skriv din e-mail")
    .max(120, "E-mailen er for lang")
    .email("Ugyldig e-mail"),
  // Kilde-siden: "forside", "footer" eller en branche-slug. Fri streng med loft,
  // saa nye branchesider virker uden kode-aendring, men uden at kunne misbruges.
  source: z.string().trim().min(1).max(80),
});

export type MarketingSignupInput = z.infer<typeof marketingSignupSchema>;

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
