import { z } from "zod";
import { STAMPS_MIN, STAMPS_MAX } from "./system-config";

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Farve skal være en hex-værdi, fx #A6502E");

export const stampIconEnum = z.enum([
  "coffee",
  "scissors",
  "croissant",
  "pizza",
  "burger",
  "beer",
  "icecream",
  "wine",
  "heart",
  "star",
  "custom",
]);

export const pinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "PIN skal være 4 til 6 cifre");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Ugyldig e-mail");

// Onboarding, trin 1
export const onboardingStartSchema = z.object({
  name: z.string().trim().min(2, "Skriv virksomhedens navn").max(60),
  email: emailSchema,
});

// Kortdesign (bruges i onboarding trin 2 og i kortdesigneren)
export const cardDesignSchema = z.object({
  stampsRequired: z.coerce.number().int().min(STAMPS_MIN).max(STAMPS_MAX),
  rewardText: z.string().trim().min(2, "Skriv en belønning").max(80),
  stampIcon: stampIconEnum,
  primaryColor: hex,
  textColor: hex,
  // Logo er enten en data-URL (gemt direkte, ingen ekstern tjeneste) eller
  // en http(s)-URL. Maks ca. 800 KB som base64.
  logoUrl: z
    .string()
    .max(800_000, "Logoet er for stort")
    .refine(
      (v) => v.startsWith("data:image/") || /^https?:\/\//.test(v),
      "Ugyldigt logo",
    )
    .nullable()
    .optional(),
});

// Virksomhedsindstillinger
export const businessSettingsSchema = z.object({
  name: z.string().trim().min(2).max(60),
  stampCooldownMin: z.coerce.number().int().min(0).max(1440),
});

export const setPinSchema = z.object({
  pin: pinSchema,
});

// Kampagne
export const campaignSchema = z
  .object({
    type: z.enum(["DOUBLE_STAMP", "WELCOME_BONUS"]),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((v) => v.endsAt > v.startsAt, {
    message: "Slutdato skal ligge efter startdato",
    path: ["endsAt"],
  });

// Indløsning kræver PIN
export const redeemSchema = z.object({
  serial: z.string().min(4),
  pin: pinSchema,
});

// Personale-scan (stempl via serial). count: antal stempler paa denne scanning.
// idempotencyKey: samme noegle paa et retry (fx daarligt wifi) deduplikeres
// server-side, saa kunden ikke faar et ekstra stempel.
export const staffStampSchema = z.object({
  serial: z.string().min(4),
  count: z.number().int().min(1).max(20).optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

export type CardDesignInput = z.infer<typeof cardDesignSchema>;
export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
