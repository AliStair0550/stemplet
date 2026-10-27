import { z } from "zod";

// Validering af oprettelsesanmodningen (butik der vil have et stempelkort, evt.
// med Henvisninger oven i). Server-only, saa zod ikke havner i klient-bundlen.
export const startRequestSchema = z
  .object({
  businessName: z
    .string()
    .trim()
    .min(1, "Skriv virksomhedens navn")
    .max(120, "Navnet er for langt"),
  // Stempelkortets beloenning. Kan staa tom, naar Henvisninger er valgt (en salon
  // fra Henvisningers forside skal ikke tvinges til at beskrive et stempelkort).
  reward: z.string().trim().max(300, "Beskrivelsen er for lang").default(""),
  wantsReferrals: z.boolean().default(false),
  // Fra = kun Henvisninger (uden stempelkort). Standard til, som foer.
  wantsStamps: z.boolean().default(true),
  referralReward: z.string().trim().max(300, "Beskrivelsen er for lang").optional(),
  contactName: z.string().trim().max(80, "Navnet er for langt").optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Skriv din e-mail")
    .max(120, "E-mailen er for lang")
    .email("Ugyldig e-mail"),
  phone: z.string().trim().max(40, "Nummeret er for langt").optional(),
  })
  .superRefine((d, ctx) => {
    if (!d.wantsStamps && !d.wantsReferrals) {
      ctx.addIssue({ code: "custom", path: ["wantsStamps"], message: "Vælg mindst ét produkt" });
      return;
    }
    if (d.wantsStamps && d.wantsReferrals && !d.referralReward) {
      ctx.addIssue({ code: "custom", path: ["referralReward"], message: "Beskriv kort, hvad vennen og ambassadøren får" });
      return;
    }
    if (d.wantsReferrals) {
      if (!d.referralReward) {
        ctx.addIssue({ code: "custom", path: ["referralReward"], message: "Beskriv kort, hvad vennen og ambassadøren får" });
      }
    } else if (!d.reward) {
      ctx.addIssue({ code: "custom", path: ["reward"], message: "Beskriv kort den ønskede belønning" });
    }
  });

export type StartRequestInput = z.infer<typeof startRequestSchema>;
