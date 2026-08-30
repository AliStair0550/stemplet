import { z } from "zod";

// Zod-validering af visitkort-designet. HOLDT SEPARAT fra lib/visitkort.ts, saa
// klient-komponenterne (designer + preview) kan importere typer, konstanter og
// rene hjaelpere UDEN at traekke zod ind i klient-bundlen. Kun server-actions og
// PDF-ruten importerer dette skema.

const hex = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .catch("#1A1A1A");
const colors = z.object({ bg: hex, text: hex, accent: hex });

export const visitkortSchema = z.object({
  template: z.enum([
    "split",
    "venstre",
    "hoejre",
    "centreret",
    "topbaand",
    "sidebjaelke",
  ]),
  font: z.enum(["sans", "serif", "mono"]),
  corners: z.enum(["skarpe", "afrundede"]),
  dieCut: z.boolean(),
  orientation: z.enum(["landscape", "portrait"]),
  background: z.enum(["flad", "ikoner"]),
  front: colors,
  back: colors,
  name: z.string().max(60),
  tagline: z.string().max(80),
  taglineAccent: z.string().max(60),
  phone: z.string().max(40),
  email: z.string().max(80),
  web: z.string().max(80),
  address: z.string().max(120),
  showLogo: z.boolean(),
  logoScale: z.coerce.number().min(0.4).max(2.5).catch(1),
  // Sikkert interval, saa QR'en aldrig bliver for lille til at scanne.
  qrScale: z.coerce.number().min(0.8).max(1.4).catch(1),
  nameBold: z.boolean(),
  taglineBold: z.boolean(),
  backContent: z.enum(["qr", "stempelkort"]),
  backHeadline: z.string().max(60),
  backHeadlineAccent: z.string().max(60),
  backLine1: z.string().max(60),
  backLine2: z.string().max(60),
  headlineBold: z.boolean(),
  line1Bold: z.boolean(),
  line2Bold: z.boolean(),
});
