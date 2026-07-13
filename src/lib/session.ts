import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

// React cache() dedupliker opslaget indenfor samme request, saa layout OG page
// ikke hver koerer en separat business.findUnique paa hver dashboard-navigation.
const findBusinessById = cache((id: string) =>
  prisma.business.findUnique({ where: { id } }),
);

/** Returnerer virksomheden for den aktive session, ellers null. */
export async function getSessionBusiness(): Promise<Business | null> {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) return null;
  return findBusinessById(businessId);
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
  const business = await findBusinessById(businessId);
  if (!business) {
    redirect("/login");
  }
  return {
    business,
    userId: session.user.id,
    email: session.user.email ?? "",
  };
}
