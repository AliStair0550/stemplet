"use server";

import { revalidatePath } from "next/cache";
import type { MemberRole } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { durableRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/sentry";

// Medarbejdere: en butik kan have flere logins (medlemskaber). Alle logger ind
// med magisk link, ingen adgangskoder. OWNER har fuld adgang til dashboardet;
// STAFF kan kun bruge kassen. En mail kan vaere medlem af FLERE butikker, saa
// den samme person kan hjaelpe/skifte mellem butikker.
const MAX_MEMBERS = 12;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Result = { ok: true } | { ok: false; error: string };

// Baaret ud af transaktionen som en pæn brugerfejl (ruller tilbage).
class MemberError extends Error {}

function landing(role: MemberRole): string {
  return role === "STAFF" ? "/kasse" : "/app";
}

// Send et magisk login-link til en mail. Best-effort: en mail-fejl maa aldrig
// vaelte selve tilfoejelsen (de kan altid selv hente et link paa /login).
async function sendLoginLink(email: string, role: MemberRole): Promise<void> {
  try {
    if (!(await durableRateLimit("login-email", email, 3, 3600))) return;
    await signIn("resend", { email, redirect: false, redirectTo: landing(role) });
  } catch (e) {
    const digest = (e as { digest?: string })?.digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return;
    captureServerError(e, { route: "staff:send-login-link" });
  }
}

export async function addMember(input: {
  name: string;
  email: string;
  role: MemberRole;
}): Promise<Result> {
  const { business } = await requireBusiness();
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim().slice(0, 60);
  const role: MemberRole = input.role === "OWNER" ? "OWNER" : "STAFF";
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Skriv en gyldig e-mail, fx navn@mail.dk." };
  }

  const count = await prisma.membership.count({
    where: { businessId: business.id },
  });
  if (count >= MAX_MEMBERS) {
    return { ok: false, error: `Du kan have op til ${MAX_MEMBERS} med login.` };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true },
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
        return { ok: false, error: "Den mail har allerede adgang." };
      }
      await prisma.membership.create({
        data: { userId: existing.id, businessId: business.id, role },
      });
      if (name && !existing.name) {
        await prisma.user.update({ where: { id: existing.id }, data: { name } });
      }
    } else {
      // Ny person: opret bruger (primaer butik = denne) + medlemskab atomisk.
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: { email, businessId: business.id, name: name || (role === "OWNER" ? business.name : null) },
          select: { id: true },
        });
        await tx.membership.create({
          data: { userId: user.id, businessId: business.id, role },
        });
      });
    }
  } catch (e) {
    captureServerError(e, { route: "staff:add" });
    return { ok: false, error: "Kunne ikke tilføje medarbejderen. Prøv igen." };
  }

  await sendLoginLink(email, role);
  revalidatePath("/app/medarbejdere");
  return { ok: true };
}

export async function removeMember(userId: string): Promise<Result> {
  const { business, userId: currentUserId } = await requireBusiness();
  if (userId === currentUserId) {
    return { ok: false, error: "Du kan ikke fjerne din egen adgang." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Laas butik-raekken, saa samtidige aendringer serialiseres og butikken
      // aldrig kan ende uden en ejer (permanent laasning).
      await tx.$executeRaw`SELECT 1 FROM "Business" WHERE "id" = ${business.id} FOR UPDATE`;
      const membership = await tx.membership.findUnique({
        where: { userId_businessId: { userId, businessId: business.id } },
        select: { id: true, role: true },
      });
      if (!membership) {
        throw new MemberError("Adgangen blev ikke fundet.");
      }
      if (membership.role === "OWNER") {
        const owners = await tx.membership.count({
          where: { businessId: business.id, role: "OWNER" },
        });
        if (owners <= 1) {
          throw new MemberError("Butikken skal have mindst én med adgang til alt.");
        }
      }
      await tx.membership.delete({ where: { id: membership.id } });
    });
  } catch (e) {
    if (e instanceof MemberError) return { ok: false, error: e.message };
    captureServerError(e, { route: "staff:remove" });
    return { ok: false, error: "Kunne ikke fjerne adgangen. Prøv igen." };
  }

  revalidatePath("/app/medarbejdere");
  return { ok: true };
}

export async function setMemberRole(userId: string, roleRaw: MemberRole): Promise<Result> {
  const { business, userId: currentUserId } = await requireBusiness();
  const role: MemberRole = roleRaw === "OWNER" ? "OWNER" : "STAFF";
  if (userId === currentUserId) {
    return { ok: false, error: "Du kan ikke ændre din egen adgang." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT 1 FROM "Business" WHERE "id" = ${business.id} FOR UPDATE`;
      const membership = await tx.membership.findUnique({
        where: { userId_businessId: { userId, businessId: business.id } },
        select: { id: true, role: true },
      });
      if (!membership) throw new MemberError("Adgangen blev ikke fundet.");
      if (membership.role === role) return;
      if (membership.role === "OWNER") {
        const owners = await tx.membership.count({
          where: { businessId: business.id, role: "OWNER" },
        });
        if (owners <= 1) {
          throw new MemberError("Butikken skal have mindst én med adgang til alt.");
        }
      }
      await tx.membership.update({ where: { id: membership.id }, data: { role } });
    });
  } catch (e) {
    if (e instanceof MemberError) return { ok: false, error: e.message };
    captureServerError(e, { route: "staff:set-role" });
    return { ok: false, error: "Kunne ikke ændre adgangen. Prøv igen." };
  }

  revalidatePath("/app/medarbejdere");
  return { ok: true };
}

export async function resendLoginLink(userId: string): Promise<Result> {
  const { business } = await requireBusiness();
  // Verificér at brugeren rent faktisk er medlem af denne butik.
  const membership = await prisma.membership.findUnique({
    where: { userId_businessId: { userId, businessId: business.id } },
    select: { role: true, user: { select: { email: true } } },
  });
  if (!membership) {
    return { ok: false, error: "Adgangen blev ikke fundet." };
  }
  await sendLoginLink(membership.user.email, membership.role);
  return { ok: true };
}
