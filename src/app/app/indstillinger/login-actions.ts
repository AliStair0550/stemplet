"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

// Login-adgang: en butik kan have flere login-mails (samme Business, flere User).
// Alle logger ind med magisk link, saa der er ingen adgangskoder. Alle med
// login-adgang har fuld adgang til butikken (delt ejerskab).
const MAX_LOGIN_EMAILS = 5;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Result = { ok: true } | { ok: false; error: string };

// Send et magisk login-link til en mail. Best-effort: en mail-fejl maa aldrig
// vaelte selve tilfoejelsen (de kan altid selv hente et link paa /login).
async function sendLoginLink(email: string): Promise<void> {
  try {
    if (!(await durableRateLimit("login-email", email, 3, 3600))) return;
    await signIn("resend", { email, redirect: false, redirectTo: "/app" });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    // redirect:false boer forhindre NEXT_REDIRECT; sker det alligevel, ER mailen
    // afsendt foer redirecten, saa vi behandler det som sendt.
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return;
    captureServerError(e, { route: "settings:send-login-link" });
  }
}

export async function addLoginEmail(emailRaw: string): Promise<Result> {
  const { business } = await requireBusiness();
  const email = emailRaw.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Skriv en gyldig e-mail, fx navn@butik.dk." };
  }

  const count = await prisma.user.count({ where: { businessId: business.id } });
  if (count >= MAX_LOGIN_EMAILS) {
    return {
      ok: false,
      error: `Du kan tilføje op til ${MAX_LOGIN_EMAILS} login-mails.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { businessId: true },
  });
  if (existing) {
    return existing.businessId === business.id
      ? { ok: false, error: "Denne mail har allerede login-adgang." }
      : {
          ok: false,
          error: "Denne mail er allerede tilknyttet en anden konto.",
        };
  }

  try {
    await prisma.user.create({
      data: { email, businessId: business.id, name: business.name },
    });
  } catch (e) {
    captureServerError(e, { route: "settings:add-login-email" });
    return { ok: false, error: "Kunne ikke tilføje mailen. Prøv igen." };
  }

  await sendLoginLink(email);
  revalidatePath("/app/indstillinger");
  return { ok: true };
}

export async function removeLoginEmail(userId: string): Promise<Result> {
  const { business, userId: currentUserId } = await requireBusiness();
  if (userId === currentUserId) {
    return { ok: false, error: "Du kan ikke fjerne din egen login-adgang." };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { businessId: true },
  });
  if (!target || target.businessId !== business.id) {
    return { ok: false, error: "Brugeren blev ikke fundet." };
  }

  const count = await prisma.user.count({ where: { businessId: business.id } });
  if (count <= 1) {
    return { ok: false, error: "Butikken skal have mindst én login-mail." };
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/app/indstillinger");
  return { ok: true };
}

export async function resendLoginLink(userId: string): Promise<Result> {
  const { business } = await requireBusiness();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, businessId: true },
  });
  if (!target || target.businessId !== business.id) {
    return { ok: false, error: "Brugeren blev ikke fundet." };
  }
  await sendLoginLink(target.email);
  return { ok: true };
}
