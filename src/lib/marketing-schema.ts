import { z } from "zod";

// Zod-validering af "Hold mig orienteret"-tilmeldingen. HOLDT SEPARAT fra
// lib/marketing.ts, saa admin-tabellen (klient) kan importere labels/hjaelpere
// UDEN at traekke zod ind i klient-bundlen. Kun API-ruten importerer dette.

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
