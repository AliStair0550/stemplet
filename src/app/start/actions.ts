"use server";

import QRCode from "qrcode";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { checkRateLimit } from "@/lib/redis";
import {
  onboardingStartSchema,
  cardDesignSchema,
  pinSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { hashPin } from "@/lib/security";
import { APP_URL } from "@/lib/env";
import type { CardDesign } from "@/components/CardDesigner";

export type CreateResult =
  | { ok: true; slug: string; cardUrl: string; qrDataUrl: string }
  | { ok: false; error: string };

export async function createBusinessAction(input: {
  name: string;
  email: string;
  pin: string;
  design: CardDesign;
}): Promise<CreateResult> {
  const base = onboardingStartSchema.safeParse({
    name: input.name,
    email: input.email,
  });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Tjek felterne." };
  }
  const pinParsed = pinSchema.safeParse(input.pin);
  if (!pinParsed.success) {
    return { ok: false, error: "Personale-PIN skal være 4 til 6 cifre." };
  }
  const design = cardDesignSchema.safeParse(input.design);
  if (!design.success) {
    return {
      ok: false,
      error: design.error.issues[0]?.message ?? "Tjek kortdesignet.",
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: base.data.email },
  });
  if (existing) {
    return {
      ok: false,
      error: "Der findes allerede en konto med den e-mail. Log ind i stedet.",
    };
  }

  // Unik slug ud fra navnet.
  const root = slugify(base.data.name) || "butik";
  let slug = root;
  let n = 1;
  while (await prisma.business.findUnique({ where: { slug } })) {
    n += 1;
    slug = `${root}-${n}`;
  }

  const staffPin = await hashPin(pinParsed.data);

  try {
    await prisma.business.create({
      data: {
        name: base.data.name,
        slug,
        primaryColor: design.data.primaryColor,
        textColor: design.data.textColor,
        logoUrl: design.data.logoUrl ?? null,
        staffPin,
        users: { create: { email: base.data.email, name: base.data.name } },
        cards: {
          create: {
            stampsRequired: design.data.stampsRequired,
            rewardText: design.data.rewardText,
            stampIcon: design.data.stampIcon,
            active: true,
          },
        },
      },
    });
  } catch (e) {
    if (
      e &&
      typeof e === "object" &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return {
        ok: false,
        error:
          "Der findes allerede en konto med den e-mail, eller navnet er lige blevet taget. Prøv igen.",
      };
    }
    throw e;
  }

  const cardUrl = `${APP_URL}/k/${slug}`;
  const qrDataUrl = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 640,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return { ok: true, slug, cardUrl, qrDataUrl };
}

export async function sendOnboardingLogin(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return;

  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "ukendt";
  const [emailOk, ipOk] = await Promise.all([
    checkRateLimit("login-email", 3, "1 h", email),
    checkRateLimit("login-ip", 10, "1 h", ip),
  ]);
  // Ved onboarding er kontoen lige oprettet - bloker ikke, men undgaa
  // gentagne mails hvis nogen spammer knappen.
  if (!emailOk || !ipOk) return;

  await signIn("resend", { email, redirectTo: "/app" });
}
