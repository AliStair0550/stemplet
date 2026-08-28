import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";

// Den aktive butik ligger i en cookie (kan skiftes uden nyt login) og
// VERIFICERES altid mod Membership, saa en bruger aldrig kan ramme en butik, de
// ikke er medlem af.
export const ACTIVE_BUSINESS_COOKIE = "stemplet_active_business";

// Aktiv butiks id: cookie-valget hvis det er et gyldigt medlemskab, ellers det
// foerste medlemskab. cache() dedupliker inden for samme request.
const activeBusinessId = cache(
  async (userId: string): Promise<string | null> => {
    const wanted = (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value;
    if (wanted) {
      const m = await prisma.membership.findUnique({
        where: { userId_businessId: { userId, businessId: wanted } },
        select: { businessId: true },
      });
      if (m) return m.businessId;
    }
    const first = await prisma.membership.findFirst({
      where: { userId },
      select: { businessId: true },
      orderBy: { createdAt: "asc" },
    });
    return first?.businessId ?? null;
  },
);

const findBusinessById = cache((id: string) =>
  prisma.business.findUnique({ where: { id } }),
);

/** Returnerer den aktive virksomhed for sessionen, ellers null. */
export async function getSessionBusiness(): Promise<Business | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const id = await activeBusinessId(userId);
  return id ? findBusinessById(id) : null;
}

/** Den aktive butiks id (til API-ruter der scoper paa butik). */
export async function getSessionBusinessId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return activeBusinessId(userId);
}

/** Krav om login. Redirecter til /login uden gyldig session + et medlemskab. */
export async function requireBusiness(): Promise<{
  business: Business;
  userId: string;
  email: string;
}> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId || !session.user) {
    redirect("/login");
  }
  const id = await activeBusinessId(userId);
  const business = id ? await findBusinessById(id) : null;
  if (!business) {
    redirect("/login");
  }
  return {
    business,
    userId,
    email: session.user.email ?? "",
  };
}

/** Alle butikker brugeren har adgang til (til butik-skifteren i menuen). */
export const getMyBusinesses = cache(
  async (): Promise<{ id: string; name: string }[]> => {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    const rows = await prisma.membership.findMany({
      where: { userId },
      select: { business: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => r.business);
  },
);
