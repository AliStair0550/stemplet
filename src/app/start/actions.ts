"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { unstable_rethrow, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { createOnboardingToken } from "@/lib/onboarding-token";
import { durableRateLimit } from "@/lib/rate-limit";
import { onboardingStartSchema } from "@/lib/validation";
import { APP_URL } from "@/lib/env";
import { sendEmail } from "@/lib/send-email";
import { superadminRecipients } from "@/lib/superadmin-emails";
import { superadminNewBusinessEmail } from "@/lib/emails";
import { captureServerError } from "@/lib/sentry";
import { createReferralBusiness, ReferralOnboardingError } from "@/lib/referral-onboarding";
import { createStampBusiness, StampOnboardingError } from "@/lib/stamp-onboarding";

// Faelles for de selvbetjente oprettelser (Henvisninger og Stemplet): IP fra
// Vercel-headeren til rate-limit.
async function requestIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "ukendt";
}

// Login-mail som fallback (hvis auto-login ikke lykkes), besked til superadmin
// efter svaret og et kortlivet token til auto-login.
async function finishSelfServeSignup(o: {
  name: string;
  email: string;
  userId: string;
  slug: string;
  contactName?: string;
  category: string;
  pageUrl: string;
  dest: string;
}): Promise<string> {
  const contactName = o.contactName?.trim();
  if (contactName) {
    await prisma.user.update({ where: { id: o.userId }, data: { name: contactName.slice(0, 80) } }).catch(() => {});
  }
  try {
    await signIn("resend", { email: o.email, redirect: false, redirectTo: o.dest });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    if (!(typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))) {
      captureServerError(e, { route: "start:self-serve-login", extra: { slug: o.slug } });
    }
  }
  after(async () => {
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
 * Selvbetjent oprettelse via Henvisninger: butikken oprettes straks med
 * Henvisninger slaaet til (Stemplet fra) og rabatordningen som regel. Svaret
 * giver et kortlivet login-token, saa ejeren kommer direkte ind i dashboardet.
 */
export async function createReferralBusinessAction(input: {
  name: string;
  email: string;
  contactName?: string;
  friendReward: string;
  referrerReward: string;
  acceptedTerms: boolean;
}): Promise<SelfServeResult> {
  if (!input.acceptedTerms) {
    return { ok: false, error: "Du skal acceptere betingelserne for at oprette en butik." };
  }
  const base = onboardingStartSchema.safeParse({ name: input.name, email: input.email });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Tjek felterne." };
  }
  if (!(await durableRateLimit("start-henvisninger", await requestIp(), 5, 3600))) {
    return { ok: false, error: "For mange forsøg. Prøv igen om lidt." };
  }
  let created: { businessId: string; userId: string; slug: string };
  try {
    created = await createReferralBusiness({
      name: base.data.name,
      email: base.data.email,
      friendReward: input.friendReward,
      referrerReward: input.referrerReward,
    });
  } catch (e) {
    if (e instanceof ReferralOnboardingError) {
      return { ok: false, error: e.message, field: e.code === "EMAIL_TAKEN" ? "email" : undefined };
    }
    throw e;
  }
  const loginToken = await finishSelfServeSignup({
    name: base.data.name,
    email: base.data.email,
    userId: created.userId,
    slug: created.slug,
    contactName: input.contactName,
    category: "Henvisninger (uden Stemplet)",
    pageUrl: `${APP_URL}/k/${created.slug}`,
    dest: "/app/henvisninger",
  });
  return { ok: true, loginToken };
}

/**
 * Selvbetjent oprettelse af Stemplet (/start): butik og stempelkort med det
 * samme, og ejeren logges direkte ind paa Stemplets overblik, hvor linket og
 * QR-koden ligger klar.
 */
export async function createStampBusinessAction(input: {
  name: string;
  email: string;
  contactName?: string;
  rewardText: string;
  stampsRequired: number;
  stampIcon: string;
  acceptedTerms: boolean;
}): Promise<SelfServeResult> {
  if (!input.acceptedTerms) {
    return { ok: false, error: "Du skal acceptere betingelserne for at oprette en butik." };
  }
  const base = onboardingStartSchema.safeParse({ name: input.name, email: input.email });
  if (!base.success) {
    return { ok: false, error: base.error.issues[0]?.message ?? "Tjek felterne." };
  }
  if (!(await durableRateLimit("start-stemplet", await requestIp(), 5, 3600))) {
    return { ok: false, error: "For mange forsøg. Prøv igen om lidt." };
  }
  let created: { businessId: string; userId: string; slug: string };
  try {
    created = await createStampBusiness({
      name: base.data.name,
      email: base.data.email,
      rewardText: input.rewardText,
      stampsRequired: input.stampsRequired,
      stampIcon: input.stampIcon,
    });
  } catch (e) {
    if (e instanceof StampOnboardingError) {
      return { ok: false, error: e.message, field: e.code === "EMAIL_TAKEN" ? "email" : undefined };
    }
    throw e;
  }
  const loginToken = await finishSelfServeSignup({
    name: base.data.name,
    email: base.data.email,
    userId: created.userId,
    slug: created.slug,
    contactName: input.contactName,
    category: "Stemplet",
    pageUrl: `${APP_URL}/k/${created.slug}`,
    dest: "/app/stemplet",
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

