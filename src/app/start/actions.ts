"use server";

import QRCode from "qrcode";
import { headers } from "next/headers";
import { after } from "next/server";
import { unstable_rethrow, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import {
  createOnboardingToken,
  verifyOnboardingToken,
} from "@/lib/onboarding-token";
import { createPairingCode } from "@/lib/kasse";
import { durableRateLimit } from "@/lib/rate-limit";
import {
  onboardingStartSchema,
  cardDesignSchema,
  pinSchema,
} from "@/lib/validation";
import { slugify } from "@/lib/utils";
import { hashPin } from "@/lib/security";
import { isBusinessCategory, categoryLabel } from "@/lib/categories";
import { geocodeAddress, roundCoord } from "@/lib/geocode";
import { APP_URL } from "@/lib/env";
import { sendEmail } from "@/lib/send-email";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { superadminNewBusinessEmail } from "@/lib/emails";
import { captureServerError } from "@/lib/sentry";
import type { CardDesign } from "@/components/CardDesigner";

export type CreateResult =
  | {
      ok: true;
      slug: string;
      cardUrl: string;
      qrDataUrl: string;
      // Blev login-linket sendt automatisk ved oprettelsen? Ellers viser
      // kvitteringen en tydelig "send igen"-knap som fallback.
      loginSent: boolean;
      // Kortlivet token til at komme DIREKTE ind i dashboardet (auto-login),
      // saa ejeren ikke behoever at aabne mailen foerst.
      loginToken?: string;
    }
  | { ok: false; error: string; field?: "address" | "email" };

export async function createBusinessAction(input: {
  name: string;
  email: string;
  pin?: string;
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
  // Personale-PIN er valgfri. Er der indtastet en, valideres og hashes den;
  // ellers oprettes butikken uden PIN (indloesning kraever da ingen PIN).
  const rawPin = (input.pin ?? "").trim();
  let staffPin: string | null = null;
  if (rawPin) {
    const pinParsed = pinSchema.safeParse(rawPin);
    if (!pinParsed.success) {
      return { ok: false, error: "Personale-PIN skal være 4 til 6 cifre." };
    }
    staffPin = await hashPin(pinParsed.data);
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
      field: "email",
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

  const category =
    input.category && isBusinessCategory(input.category) ? input.category : null;

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

  let createdUserId: string | null = null;
  try {
    // Butik + ejer-bruger + medlemskab i EEN transaktion, saa ejeren altid faar
    // adgang (medlemskab) til den nyoprettede butik.
    createdUserId = await prisma.$transaction(async (tx) => {
      const businessRow = await tx.business.create({
        select: { id: true, users: { select: { id: true } } },
        data: {
          name: base.data.name,
          displayName: design.data.displayName?.trim() || null,
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
          category,
          users: { create: { email: base.data.email, name: base.data.name } },
          cards: {
            create: {
              stampsRequired: design.data.stampsRequired,
              rewardText: design.data.rewardText,
              stampIcon: design.data.stampIcon,
              terms: design.data.terms || null,
              active: true,
            },
          },
        },
      });
      const uid = businessRow.users[0]?.id ?? null;
      if (uid) {
        await tx.membership.create({
          data: { userId: uid, businessId: businessRow.id },
        });
      }
      return uid;
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
        field: "email",
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

  // Send login-linket med det samme, saa den brandede login-mail ligger i
  // kundens indbakke, naar de rammer "Du er klar". redirect:false, saa selve
  // oprettelses-svaret ikke omdirigeres. Lykkes det ikke, faar de en tydelig
  // "send igen"-knap paa kvitteringen, saa de aldrig staar strandet.
  let loginSent = false;
  try {
    // redirectTo: "/app" gOr, at mail-linket fOrer DIREKTE ind i dashboardet
    // (ikke tilbage til start). redirect:false holder selve oprettelses-svaret
    // paa kvitteringen.
    await signIn("resend", {
      email: base.data.email,
      redirect: false,
      redirectTo: "/app",
    });
    loginSent = true;
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    // redirect:false boer forhindre NEXT_REDIRECT; sker det alligevel, ER mailen
    // afsendt foer redirecten, saa vi behandler det som sendt (og rethrower ikke,
    // for vi vil BLIVE paa kvitteringen).
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) {
      loginSent = true;
    } else {
      captureServerError(e, { route: "start:auto-login", extra: { slug } });
    }
  }

  // Giv superadmin besked om den nye butik, saa vi kan foelge med i opstarten.
  // Sendes EFTER svaret (after), saa en mail-fejl aldrig forsinker eller braekker
  // selve oprettelsen. Springes helt over, hvis SUPERADMIN_EMAIL ikke er sat.
  after(async () => {
    const recipients = superadminRecipients();
    if (recipients.length === 0) return;
    const mail = superadminNewBusinessEmail({
      businessName: base.data.name,
      slug,
      ownerEmail: base.data.email,
      category: categoryLabel(category) ?? "(ingen)",
      address: location?.address ?? "(ingen)",
      cardUrl,
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      try {
        await sendEmail({ to, ...mail });
      } catch (e) {
        captureServerError(e, {
          route: "start:new-business-notify",
          extra: { slug },
        });
      }
    }
  });

  // Token til "Gå til mit dashboard"-knappen paa kvitteringen (auto-login).
  const loginToken = createdUserId
    ? createOnboardingToken(createdUserId)
    : undefined;

  return { ok: true, slug, cardUrl, qrDataUrl, loginSent, loginToken };
}

// Auto-login efter oprettelse: kvitteringens "Gå til mit dashboard"-knap sender
// det kortlivede token her, saa ejeren kommer direkte ind uden at aabne mailen.
export async function loginWithOnboardingToken(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  // Maalside efter login. Whitelistes til interne /app-stier, saa den ikke kan
  // misbruges til open redirect. Standard er overblikket.
  const destRaw = String(formData.get("dest") ?? "/app");
  const dest = /^\/app(\/[\w\-/#]*)?$/.test(destRaw) ? destRaw : "/app";
  if (!token) redirect("/login?fejl=onboarding");
  try {
    await signIn("onboarding", { token, redirectTo: dest });
  } catch (e) {
    unstable_rethrow(e); // lad succes-redirecten passere
    // Ugyldigt/udloebet token: send pænt til login, hvor de kan hente linket.
    redirect("/login?fejl=onboarding");
  }
}

// Danner en parringskode til en kasse-enhed DIREKTE fra kvitteringen (uden at
// forlade successiden), autentificeret via onboarding-tokenet.
export async function createOnboardingPairingCode(
  token: string,
): Promise<{ ok: true; code: string; qrDataUrl: string } | { ok: false }> {
  const payload = verifyOnboardingToken(token);
  if (!payload) return { ok: false };
  // Den netop oprettede butik = brugerens foerste (og eneste) medlemskab.
  const membership = await prisma.membership.findFirst({
    where: { userId: payload.uid },
    select: { businessId: true },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return { ok: false };
  try {
    const { code, qrDataUrl } = await createPairingCode(membership.businessId);
    return { ok: true, code, qrDataUrl };
  } catch (e) {
    captureServerError(e, { route: "start:onboarding-pairing" });
    return { ok: false };
  }
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
  // Rate-limit og magic-link er samlet i eet try/catch. En forbigaaende fejl
  // (mail, DB-blip, Vercel-runtime) sender brugeren pænt til login-siden, hvor de
  // kan hente linket igen, i stedet for den generiske fejlside. Butikken er
  // allerede oprettet paa dette tidspunkt. Succes-redirect fra signIn SKAL boble op.
  try {
    const [emailOk, ipOk] = await Promise.all([
      durableRateLimit("login-email", email, 3, 3600),
      durableRateLimit("login-ip", ip, 10, 3600),
    ]);
    // Ved onboarding er kontoen lige oprettet - bloker ikke, men undgaa
    // gentagne mails hvis nogen spammer knappen. Send dog til "tjek din
    // mail" (i stedet for et stille no-op), saa knappen ikke foeles doed:
    // brugeren har allerede faaet et link for nylig.
    if (!emailOk || !ipOk) redirect("/login/tjek-mail");

    await signIn("resend", { email, redirectTo: "/app" });
  } catch (e) {
    unstable_rethrow(e); // lad succes-redirect passere
    console.error("Onboarding-login fejlede:", e);
    redirect("/login?fejl=onboarding");
  }
}

// Onboarding-funnel: registrér at en anonym besoegende har naaet et trin paa
// /start, saa vi kan se HVOR folk falder fra. Fire-and-forget: fejler stille og
// braekker aldrig flowet. Een raekke pr. (anonId, trin) via unik-indeks, saa
// genindlaesninger ikke taeller dobbelt. anonId er et tilfaeldigt id fra
// browserens localStorage - ingen persondata.
export async function recordOnboardingStep(
  anonId: string,
  step: number,
): Promise<void> {
  if (typeof anonId !== "string" || !/^[a-zA-Z0-9_-]{8,64}$/.test(anonId)) return;
  if (!Number.isInteger(step) || step < 0 || step > 3) return;
  try {
    const h = await headers();
    const ip =
      h.get("x-real-ip")?.trim() ||
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "ukendt";
    // Rigeligt til en aegte besoegende (maks 4 trin); bremser blot spam.
    if (!(await durableRateLimit("onboarding-event", ip, 60, 3600))) return;
    await prisma.onboardingEvent.create({ data: { anonId, step } });
  } catch {
    // Dublet (P2002) eller forbigaaende fejl: uden betydning for funnel'en.
  }
}
