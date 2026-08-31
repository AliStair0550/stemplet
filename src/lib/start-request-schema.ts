import { z } from "zod";

// Validering af oprettelsesanmodningen (butik der vil have et stempelkort).
// Server-only, saa zod ikke havner i klient-bundlen.
export const startRequestSchema = z.object({
  businessName: z
    .string()
    .trim()
    .min(1, "Skriv virksomhedens navn")
    .max(120, "Navnet er for langt"),
  reward: z
    .string()
    .trim()
    .min(1, "Beskriv kort den ønskede belønning")
    .max(300, "Beskrivelsen er for lang"),
  contactName: z.string().trim().max(80, "Navnet er for langt").optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Skriv din e-mail")
    .max(120, "E-mailen er for lang")
    .email("Ugyldig e-mail"),
  phone: z.string().trim().max(40, "Nummeret er for langt").optional(),
});

export type StartRequestInput = z.infer<typeof startRequestSchema>;
