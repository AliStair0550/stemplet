"use server";

import type { Plan } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  verifyAdminCode,
  makeUnlockToken,
  UNLOCK_COOKIE_NAME,
  UNLOCK_TTL_SECONDS,
} from "@/lib/admin";
import { DEMO_SLUG } from "@/lib/demo";
import { signIn } from "@/lib/auth";
import { captureServerError } from "@/lib/sentry";

// Alle admin-handlinger er superadmin-gated paa serveren (ikke kun i UI'et), saa
// de ikke kan kaldes af andre. Ud over email-gaten kraeves ogsaa, at admin er
// laast op med koden (naar ADMIN_ACCESS_CODE er sat). Fejler noget, kastes en
// fejl og intet aendres.
async function requireAdmin(): Promise<string> {
  const admin = await getSuperadminEmail();
  if (!admin) throw new Error("Ikke tilladt");
  if (!(await isAdminUnlocked())) throw new Error("Admin er laast");
  return admin;
}

// Laas op med koden. Bruger email-gaten (ikke requireAdmin, da den kraever unlock).
export async function unlockAdmin(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const admin = await getSuperadminEmail();
  if (!admin) return { error: "Ikke tilladt." };
  const code = String(formData.get("code") ?? "");
  if (!verifyAdminCode(code)) return { error: "Forkert kode." };
  const jar = await cookies();
  jar.set(UNLOCK_COOKIE_NAME, makeUnlockToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: UNLOCK_TTL_SECONDS,
  });
  revalidatePath("/admin");
  return { error: null };
}

// Laas admin igen (ryd unlock-cookie).
export async function lockAdmin(): Promise<void> {
  const admin = await getSuperadminEmail();
  if (!admin) throw new Error("Ikke tilladt");
  const jar = await cookies();
  jar.delete(UNLOCK_COOKIE_NAME);
  revalidatePath("/admin");
}

const PLANS: Plan[] = ["FREE", "PRO"];

/** Skift en butiks plan (FREE/PRO). Reversibelt. */
export async function setPlan(businessId: string, plan: Plan): Promise<void> {
  await requireAdmin();
  if (!PLANS.includes(plan)) throw new Error("Ugyldig plan");
  await prisma.business.update({ where: { id: businessId }, data: { plan } });
  revalidatePath("/admin");
}

/**
 * Sæt butikkens Pro-pris (individuel, fx founding member), et valgfrit udløb for
 * specialprisen (derefter standard 99), og sidste faktureringsdato (vedligeholdes
 * manuelt, da fakturering sker via Billy). Alt superadmin-gated.
 */
export async function setBilling(
  _prev: { error: string | null; ok?: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok?: boolean }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Ikke tilladt." };
  }
  const businessId = String(formData.get("businessId") ?? "");
  if (!businessId) return { error: "Mangler butik." };

  const price = Number(String(formData.get("proPriceKr") ?? "").trim());
  if (!Number.isFinite(price) || price < 0 || price > 100000) {
    return { error: "Ugyldig pris (0 til 100000 kr.)." };
  }
  const untilRaw = String(formData.get("proPriceUntil") ?? "").trim();
  const invoicedRaw = String(formData.get("lastInvoicedAt") ?? "").trim();
  const proPriceUntil = untilRaw ? new Date(untilRaw) : null;
  const lastInvoicedAt = invoicedRaw ? new Date(invoicedRaw) : null;
  if (proPriceUntil && isNaN(proPriceUntil.getTime())) {
    return { error: "Ugyldig udløbsdato." };
  }
  if (lastInvoicedAt && isNaN(lastInvoicedAt.getTime())) {
    return { error: "Ugyldig faktureringsdato." };
  }

  await prisma.business.update({
    where: { id: businessId },
    data: { proPriceKr: Math.round(price), proPriceUntil, lastInvoicedAt },
  });
  revalidatePath("/admin");
  return { error: null, ok: true };
}

/** Pause/genoptag NYE kortholdere. Eksisterende kort virker uændret. */
export async function setSignupsPaused(
  businessId: string,
  paused: boolean,
): Promise<void> {
  await requireAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { newSignupsPaused: paused },
  });
  revalidatePath("/admin");
}

/** Stop/genåbn butikken. Stoppet: ingen nye kort OG ingen nye stempler. */
export async function setStopped(
  businessId: string,
  stopped: boolean,
): Promise<void> {
  await requireAdmin();
  await prisma.business.update({
    where: { id: businessId },
    data: { stopped },
  });
  revalidatePath("/admin");
}

/**
 * Slet en butik og ALT dens data (kort, kunder, stempler via cascade).
 * DESTRUKTIVT. Demo-butikken er spaerret, den er rygraden i "Prøv det selv".
 */
export async function deleteBusiness(businessId: string): Promise<void> {
  await requireAdmin();
  const b = await prisma.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  if (!b) return;
  if (b.slug === DEMO_SLUG) {
    throw new Error("Demo-butikken kan ikke slettes. Nulstil dens kort i stedet.");
  }
  await prisma.business.delete({ where: { id: businessId } });
  revalidatePath("/admin");
}

/**
 * Nulstil demo-kortene: sletter alle kundekort (og deres stempler via cascade)
 * paa demo-butikken, saa "35 kunder"-tallet nulstilles. Rammer KUN demoen, aldrig
 * en rigtig butik.
 */
export async function clearDemoCards(): Promise<void> {
  await requireAdmin();
  await prisma.customerCard.deleteMany({
    where: { card: { business: { slug: DEMO_SLUG } } },
  });
  revalidatePath("/admin");
}

/**
 * Nulstil en butiks stempler: saet alle kundekort til 0 og slet stempel-loggen
 * (indloesninger bevares som historik). DESTRUKTIVT. Kunderne beholder deres kort,
 * men starter forfra paa jagten.
 */
export async function resetStamps(businessId: string): Promise<void> {
  await requireAdmin();
  await prisma.$transaction([
    prisma.stamp.deleteMany({
      where: { customerCard: { card: { businessId } } },
    }),
    prisma.customerCard.updateMany({
      where: { card: { businessId } },
      data: { stamps: 0 },
    }),
  ]);
  revalidatePath("/admin");
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Redigér en ejers navn og/eller email. Email styrer login (magisk link), saa vi
 * validerer format og sikrer, at den ikke allerede bruges af en anden konto.
 */
export async function updateOwner(
  _prev: { error: string | null; ok?: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok?: boolean }> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Ikke tilladt." };
  }
  const userId = String(formData.get("userId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!userId) return { error: "Mangler bruger." };
  if (!EMAIL_RE.test(email)) return { error: "Ugyldig email." };

  const clash = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (clash && clash.id !== userId) {
    return { error: "Emailen bruges allerede af en anden konto." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { email, name: name || null },
  });
  revalidatePath("/admin");
  return { error: null, ok: true };
}

/**
 * Gensend et magisk login-link til en ejer (fx en der aldrig fik verificeret sig).
 * Bruger samme Auth.js-flow som normalt login, saa foerste login sender velkomst-
 * mailen. redirect:false, saa superadmins egen session ikke omdirigeres.
 */
export async function resendOwnerLogin(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
  } catch {
    return { ok: false, error: "Ikke tilladt." };
  }
  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Mangler email." };
  const user = await prisma.user.findUnique({
    where: { email: clean },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "Ukendt bruger." };

  try {
    await signIn("resend", { email: clean, redirect: false });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    // redirect:false boer forhindre NEXT_REDIRECT; sker det alligevel, ER mailen
    // afsendt foer redirecten, saa vi behandler det som sendt.
    if (!(typeof digest === "string" && digest.startsWith("NEXT_REDIRECT"))) {
      captureServerError(e, { route: "admin:resendOwnerLogin" });
      return { ok: false, error: "Kunne ikke sende. Prøv igen." };
    }
  }
  return { ok: true };
}

// Butiks-flag superadmin maa slaa til/fra (whitelistet, saa kun disse felter).
const BUSINESS_FLAGS = [
  "selfScanEnabled",
  "welcomeStampEnabled",
  "weeklyEmailEnabled",
] as const;
type BusinessFlag = (typeof BUSINESS_FLAGS)[number];

/** Slaa en butiksindstilling til/fra direkte fra admin. Reversibelt. */
export async function setBusinessFlag(
  businessId: string,
  flag: BusinessFlag,
  value: boolean,
): Promise<void> {
  await requireAdmin();
  if (!BUSINESS_FLAGS.includes(flag)) throw new Error("Ugyldigt felt");
  const data =
    flag === "selfScanEnabled"
      ? { selfScanEnabled: value }
      : flag === "welcomeStampEnabled"
        ? { welcomeStampEnabled: value }
        : { weeklyEmailEnabled: value };
  await prisma.business.update({ where: { id: businessId }, data });
  revalidatePath("/admin");
}
