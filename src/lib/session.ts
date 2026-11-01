import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./prisma";
import type { Business } from "@prisma/client";
import { isSuperadminEmail } from "./superadmin-emails";
import { isAdminUnlocked } from "./admin";
import { resolveKasseBusiness, resolveOwnerBusinessId } from "./membership";

// Den aktive butik ligger i en cookie (kan skiftes uden nyt login) og
// VERIFICERES altid mod Membership, saa en bruger aldrig kan ramme en butik, de
// ikke er medlem af.
export const ACTIVE_BUSINESS_COOKIE = "stemplet_active_business";

// Support: superadmin kan aabne en hvilken som helst butiks dashboard (ogsaa
// butikker, der har oprettet sig selv) for at yde service. Kun naar brugeren er
// superadmin OG admin er laast op; cookien vaelger blot butikken. Intet
// medlemskab oprettes, saa superadmin faar ikke butikkens mails og staar ikke
// paa dens adgangsliste. Udloeber senest med admin-oplaasningen.
export const SUPPORT_BUSINESS_COOKIE = "stemplet_support_business";

const supportBusinessId = cache(async (userId: string): Promise<string | null> => {
  const wanted = (await cookies()).get(SUPPORT_BUSINESS_COOKIE)?.value;
  if (!wanted) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!isSuperadminEmail(user?.email) || !(await isAdminUnlocked())) return null;
  const b = await prisma.business.findUnique({ where: { id: wanted }, select: { id: true } });
  return b?.id ?? null;
});

/** Butikken superadmin yder support i lige nu (til banneret), ellers null. */
export async function getSupportBusiness(): Promise<{ id: string; name: string } | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  const id = await supportBusinessId(userId);
  return id ? prisma.business.findUnique({ where: { id }, select: { id: true, name: true } }) : null;
}

// Aktiv butiks id: support-butikken for superadmin, ellers cookie-valget hvis
// det er et gyldigt medlemskab, ellers det foerste medlemskab. Kun EJER-
// medlemskaber: en medarbejder (STAFF) maa aldrig naa dashboardet eller dets
// API'er. cache() dedupliker inden for samme request.
const activeBusinessId = cache(
  async (userId: string): Promise<string | null> => {
    const support = await supportBusinessId(userId);
    if (support) return support;
    return resolveOwnerBusinessId(userId, (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value);
  },
);

/**
 * Butikken til kassen for et login: som activeBusinessId, men medarbejder-
 * medlemskaber taeller ogsaa. Kun til kassen (lib/kasse), aldrig til /app.
 */
export const kasseBusinessForUser = cache(
  async (userId: string): Promise<{ businessId: string; role: "OWNER" | "STAFF" } | null> => {
    const owner = await activeBusinessId(userId);
    return resolveKasseBusiness(userId, (await cookies()).get(ACTIVE_BUSINESS_COOKIE)?.value, owner);
  },
);

// Billederne (logo, kortbillede, plakatfoto) ligger som tekst i raekken, op til
// ca. 2 MB pr. butik. De fleste sider og handlinger bruger dem ikke, saa de
// hentes kun dér, hvor de vises (se businessImages).
const IMAGE_FIELDS = { logoUrl: true, cardArtwork: true, cardArt: true, posterPhoto: true } as const;
export type SessionBusiness = Omit<Business, keyof typeof IMAGE_FIELDS>;

const findBusinessById = cache((id: string) =>
  prisma.business.findUnique({ where: { id }, omit: IMAGE_FIELDS }),
);

/** Den aktive butiks id (til API-ruter der scoper paa butik). */
export async function getSessionBusinessId(): Promise<string | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;
  return activeBusinessId(userId);
}

/** Butikkens billeder, hentet for sig (kun paa sider, der viser dem). */
export const businessImages = cache((id: string) =>
  prisma.business.findUniqueOrThrow({ where: { id }, select: IMAGE_FIELDS }),
);

/** Som requireBusiness, men med billederne (Design, plakat, kasse m.fl.). */
export async function requireBusinessWithImages(): Promise<{
  business: Business;
  userId: string;
  email: string;
}> {
  const r = await requireBusiness();
  return { ...r, business: { ...r.business, ...(await businessImages(r.business.id)) } };
}

/** Krav om login. Redirecter til /login uden gyldig session + et medlemskab. */
export async function requireBusiness(): Promise<{
  business: SessionBusiness;
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
    // Superadmin uden egen butik (fx hej@folka.dk): til admin, ikke i ring via login.
    if (isSuperadminEmail(session.user.email)) redirect("/admin");
    // Medarbejder med kun kasse-adgang: direkte til kassen.
    redirect((await kasseBusinessForUser(userId)) ? "/kasse" : "/login");
  }
  return {
    business,
    userId,
    email: session.user.email ?? "",
  };
}

/**
 * Som requireBusiness, men til Stemplets egne sider: en butik med kun
 * Henvisninger sendes til siden, hvor Stemplet kan slaas til.
 */
export async function requireStampsBusiness(): ReturnType<typeof requireBusiness> {
  const r = await requireBusiness();
  if (!r.business.stampsEnabled) redirect("/app/stemplet/tilfoej");
  return r;
}

/** Alle butikker brugeren har adgang til (til butik-skifteren i menuen). */
export const getMyBusinesses = cache(
  async (): Promise<{ id: string; name: string }[]> => {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return [];
    const rows = await prisma.membership.findMany({
      where: { userId, role: "OWNER" },
      select: { business: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    const list = rows.map((r) => r.business);
    // Support: butikken, superadmin er inde i, staar oeverst i skifteren.
    const support = await getSupportBusiness();
    return support && !list.some((b) => b.id === support.id) ? [support, ...list] : list;
  },
);
