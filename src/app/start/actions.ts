"use server";

import QRCode from "qrcode";
import { headers } from "next/headers";
import { unstable_rethrow, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { durableRateLimit } from "@/lib/rate-limit";
import {
  onboardingStartSchema,
  cardDesignSchema,
  pinSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { hashPin } from "@/lib/security";
import { isBusinessCategory } from "@/lib/categories";
import { geocodeAddress, roundCoord } from "@/lib/geocode";
import { APP_URL } from "@/lib/env";
import type { CardDesign } from "@/components/CardDesigner";

export type CreateResult =
  | { ok: true; slug: string; cardUrl: string; qrDataUrl: string }
  | { ok: false; error: string; field?: "address" };

export async function createBusinessAction(input: {
  name: string;
  email: string;
  pin: string;
  category?: string;
  address?: string;
  design: CardDesign;
  acceptedTerms: boolean;
}): Promise<CreateResult> {
  if (!input.acceptedTerms) {
    return {
      ok: false,
      error:
        "Du skal acceptere handelsbetingelser, privatlivspolitik og databehandleraftale for at oprette en butik.",
    };
  }
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

  // Valgfri placering: er der indtastet en adresse, geokoder vi den nu, saa kortet
  // dukker op paa kundernes laaseskaerm fra dag et og bliver ved, indtil butikken
  // selv slaar det fra. Fejler opslaget, siger vi det klart, saa de kan rette
  // adressen eller lade feltet staa tomt.
  let location: { address: string; latitude: number; longitude: number } | null =
    null;
  const addr = input.address?.trim();
  if (addr && addr.length >= 4) {
    const geo = await geocodeAddress(addr);
    if (!geo) {
      return {
        ok: false,
        field: "address",
        error:
          "Kunne ikke finde adressen til placeringen. Ret den, eller lad feltet stå tomt og tilføj den senere i indstillinger.",
      };
    }
    location = {
      address: addr,
      latitude: roundCoord(geo.lat),
      longitude: roundCoord(geo.lng),
    };
  }

  try {
    await prisma.business.create({
      data: {
        name: base.data.name,
        slug,
        primaryColor: design.data.primaryColor,
        textColor: design.data.textColor,
        logoUrl: design.data.logoUrl ?? null,
        staffPin,
        termsAcceptedAt: new Date(),
        // Standard: velkomststempel FRA, saa flowet altid er 1. kort hentes,
        // 2. stempler gives ved kassen. Kan slaas til i indstillinger.
        welcomeStampEnabled: false,
        address: location?.address ?? null,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        category:
          input.category && isBusinessCategory(input.category)
            ? input.category
            : null,
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
  // x-real-ip saettes af Vercel og kan ikke spoofes; foretraek den.
  const ip =
    h.get("x-real-ip")?.trim() ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "ukendt";
  const [emailOk, ipOk] = await Promise.all([
    durableRateLimit("login-email", email, 3, 3600),
    durableRateLimit("login-ip", ip, 10, 3600),
  ]);
  // Ved onboarding er kontoen lige oprettet - bloker ikke, men undgaa
  // gentagne mails hvis nogen spammer knappen.
  if (!emailOk || !ipOk) return;

  // signIn redirecter til /login/tjek-mail ved succes (den redirect SKAL boble
  // op). Ved en forbigaaende fejl (mail, DB, Vercel-runtime) sender vi brugeren
  // pænt til login-siden, hvor de kan hente linket igen, i stedet for den
  // generiske fejlside. Butikken er allerede oprettet paa dette tidspunkt.
  try {
    await signIn("resend", { email, redirectTo: "/app" });
  } catch (e) {
    unstable_rethrow(e); // lad succes-redirect passere
    console.error("Onboarding-login fejlede:", e);
    redirect("/login?fejl=onboarding");
  }
}
