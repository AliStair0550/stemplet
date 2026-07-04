import { z } from "zod";

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{6})$/, "Farve skal være en hex-værdi, fx #2D5F4A");

export const stampIconEnum = z.enum([
  "coffee",
  "scissors",
  "croissant",
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
  stampsRequired: z.coerce.number().int().min(4).max(12),
  rewardText: z.string().trim().min(2, "Skriv en belønning").max(80),
  stampIcon: stampIconEnum,
  primaryColor: hex,
  textColor: hex,
  logoUrl: z.string().url().nullable().optional(),
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

// Personale-scan (stempl via serial)
export const staffStampSchema = z.object({
  serial: z.string().min(4),
});

export type CardDesignInput = z.infer<typeof cardDesignSchema>;
export type OnboardingStartInput = z.infer<typeof onboardingStartSchema>;
