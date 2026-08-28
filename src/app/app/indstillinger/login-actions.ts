"use server";

import { revalidatePath } from "next/cache";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

// Login-adgang: en butik kan have flere login-mails (medlemskaber). Alle logger
// ind med magisk link, ingen adgangskoder. En mail kan vaere medlem af FLERE
// butikker, saa den samme person kan hjaelpe/skifte mellem butikker. Alle
// medlemmer har fuld adgang til butikken (delt ejerskab).
const MAX_MEMBERS = 8;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Result = { ok: true } | { ok: false; error: string };

// Baaret ud af fjern-transaktionen som en pæn brugerfejl (ruller tilbage).
class RemoveError extends Error {}

// Send et magisk login-link til en mail. Best-effort: en mail-fejl maa aldrig
// vaelte selve tilfoejelsen (de kan altid selv hente et link paa /login).
async function sendLoginLink(email: string): Promise<void> {
  try {
    if (!(await durableRateLimit("login-email", email, 3, 3600))) return;
    await signIn("resend", { email, redirect: false, redirectTo: "/app" });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
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

  const count = await prisma.membership.count({
    where: { businessId: business.id },
  });
  if (count >= MAX_MEMBERS) {
    return {
      ok: false,
      error: `Du kan give op til ${MAX_MEMBERS} mails login-adgang.`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  try {
    if (existing) {
      // Findes brugeren allerede (evt. paa en anden butik): giv blot adgang til
      // DENNE butik via et nyt medlemskab.
      const already = await prisma.membership.findUnique({
        where: {
          userId_businessId: { userId: existing.id, businessId: business.id },
        },
        select: { id: true },
      });
      if (already) {
        return { ok: false, error: "Denne mail har allerede login-adgang." };
      }
      await prisma.membership.create({
        data: { userId: existing.id, businessId: business.id },
      });
    } else {
      // Ny person: opret bruger (primaer butik = denne) + medlemskab atomisk.
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, businessId: business.id, name: business.name },
          select: { id: true },
        });
        await tx.membership.create({
          data: { userId: user.id, businessId: business.id },
        });
      });
    }
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

  try {
    await prisma.$transaction(async (tx) => {
      // Laas butik-raekken, saa samtidige fjernelser serialiseres og butikken
      // aldrig kan ende med 0 medlemmer (permanent laasning).
      await tx.$executeRaw`SELECT 1 FROM "Business" WHERE "id" = ${business.id} FOR UPDATE`;
      const membership = await tx.membership.findUnique({
        where: { userId_businessId: { userId, businessId: business.id } },
        select: { id: true },
      });
      if (!membership) {
        throw new RemoveError("Adgangen blev ikke fundet.");
      }
      const count = await tx.membership.count({
        where: { businessId: business.id },
      });
      if (count <= 1) {
        throw new RemoveError("Butikken skal have mindst én login-mail.");
      }
      await tx.membership.delete({ where: { id: membership.id } });
    });
  } catch (e) {
    if (e instanceof RemoveError) return { ok: false, error: e.message };
    captureServerError(e, { route: "settings:remove-login-email" });
    return { ok: false, error: "Kunne ikke fjerne mailen. Prøv igen." };
  }

  revalidatePath("/app/indstillinger");
  return { ok: true };
}

export async function resendLoginLink(userId: string): Promise<Result> {
  const { business } = await requireBusiness();
  // Verificér at brugeren rent faktisk er medlem af denne butik.
  const membership = await prisma.membership.findUnique({
    where: { userId_businessId: { userId, businessId: business.id } },
    select: { user: { select: { email: true } } },
  });
  if (!membership) {
    return { ok: false, error: "Adgangen blev ikke fundet." };
  }
  await sendLoginLink(membership.user.email);
  return { ok: true };
}
