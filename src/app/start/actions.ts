"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { unstable_rethrow, redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { createOnboardingToken } from "@/lib/onboarding-token";
import { durableRateLimit } from "@/lib/rate-limit";
import { onboardingStartSchema } from "@/lib/validation";
import { APP_URL } from "@/lib/env";
import { sendEmail } from "@/lib/send-email";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { signupWelcomeEmail, superadminNewBusinessEmail } from "@/lib/emails";
import { captureServerError } from "@/lib/sentry";
import { createLoyaltyBusiness, LoyaltyOnboardingError, type LoyaltyInput } from "@/lib/loyalty-onboarding";

// IP fra Vercel-headeren til rate-limit paa den selvbetjente oprettelse.
async function requestIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
}

// Velkomstmail (uden login-kode) og besked til superadmin efter svaret, og et
// kortlivet token til auto-login.
async function finishSelfServeSignup(o: {
  name: string;
  email: string;
  userId: string;
  slug: string;
  category: string;
  pageUrl: string;
  dest: string;
}): Promise<string> {
  after(async () => {
    // Velkomstmail uden login-kode: ejeren er allerede logget ind.
    try {
      await sendEmail({ to: o.email, ...signupWelcomeEmail(`${APP_URL}/app`) });
    } catch (e) {
      captureServerError(e, { route: "start:welcome-mail", extra: { slug: o.slug } });
    }
    const recipients = superadminRecipients();
    if (recipients.length === 0) return;
    const mail = superadminNewBusinessEmail({
      businessName: o.name,
      slug: o.slug,
      ownerEmail: o.email,
      category: o.category,
      address: "(ingen)",
      cardUrl: o.pageUrl,
      adminUrl: `${APP_URL}/admin`,
    });
    for (const to of recipients) {
      try {
        await sendEmail({ to, ...mail });
      } catch (e) {
        captureServerError(e, { route: "start:self-serve-notify", extra: { slug: o.slug } });
      }
    }
  });
  return createOnboardingToken(o.userId);
}

type SelfServeResult = { ok: true; loginToken: string } | { ok: false; error: string; field?: "email" };

/**
 * Selvbetjent oprettelse af loyalitetskortet (/start): butikken vaelger, hvad
 * kortet kan fra start (henvisninger, stempler eller begge), og logges direkte
 * ind paa Hjem, hvor "Kom i gang" venter.
 */
export async function createLoyaltyBusinessAction(input: {
  name: string;
  email: string;
  stamps: LoyaltyInput["stamps"];
  referral: LoyaltyInput["referral"];
  acceptedTerms: boolean;
}): Promise<SelfServeResult> {
  if (!input.acceptedTerms) {
    return { ok: false, error: "Du skal acceptere betingelserne for at oprette en butik." };
  }
  const base = onboardingStartSchema.safeParse({ name: input.name, email: input.email });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Tjek felterne." };
  }
  if (!(await durableRateLimit("start-loyalitet", await requestIp(), 5, 3600))) {
    return { ok: false, error: "For mange forsøg. Prøv igen om lidt." };
  }
  let created: { businessId: string; userId: string; slug: string };
  try {
    created = await createLoyaltyBusiness({
      name: base.data.name,
      email: base.data.email,
      stamps: input.stamps,
      referral: input.referral,
    });
  } catch (e) {
    if (e instanceof LoyaltyOnboardingError) {
      return { ok: false, error: e.message, field: e.code === "EMAIL_TAKEN" ? "email" : undefined };
    }
    throw e;
  }
  const loginToken = await finishSelfServeSignup({
    name: base.data.name,
    email: base.data.email,
    userId: created.userId,
    slug: created.slug,
    category: [input.referral ? "Henvisninger" : null, input.stamps ? "Stempler" : null].filter(Boolean).join(" + "),
    pageUrl: `${APP_URL}/k/${created.slug}`,
    dest: "/app",
  });
  return { ok: true, loginToken };
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

