import "server-only";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

/** Returnerer virksomheden for den aktive session, ellers null. */
export async function getSessionBusiness(): Promise<Business | null> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return null;
  return prisma.business.findUnique({ where: { id: businessId } });
}

/** Krav om login. Redirecter til /login hvis der ikke er en gyldig session. */
export async function requireBusiness(): Promise<{
  business: Business;
  userId: string;
  email: string;
}> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId || !session?.user) {
    redirect("/login");
  }
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  if (!business) {
    redirect("/login");
  }
  return {
    business,
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}
