import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading } from "@/components/dash";
import { listDevices } from "@/lib/kasse";
import { TeamManager } from "./TeamManager";

export const metadata: Metadata = { title: "Medarbejdere" };
export const dynamic = "force-dynamic";

// Medarbejdere: hvem har adgang, og hvad maa de. Hver medarbejder faar sit eget
// login (mail, ingen adgangskode) med enten kun kassen eller adgang til alt. En
// faelles kasse-enhed (iPad i butikken) parres med et link uden login.
export default async function MedarbejderePage() {
  const { business, userId } = await requireBusiness();

  const [memberships, devices] = await Promise.all([
    prisma.membership.findMany({
      where: { businessId: business.id },
      select: {
        role: true,
        user: { select: { id: true, email: true, name: true, emailVerified: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    listDevices(business.id),
  ]);

  const members = memberships.map((m) => ({
    id: m.user.id,
    email: m.user.email,
    // Ejere fik tidligere butikkens navn som navn; det er ikke et personnavn.
    name: m.user.name && m.user.name !== business.name ? m.user.name : null,
    role: m.role,
    isYou: m.user.id === userId,
    verified: m.user.emailVerified != null,
  }));
  const deviceList = devices.map((d) => ({
    id: d.id,
    name: d.name,
    lastSeenAt: d.lastSeenAt ? d.lastSeenAt.toISOString() : null,
  }));

  return (
    <>
      <PageHeading
        title="Medarbejdere"
        subtitle="Giv dit personale eget login. De logger ind med deres mail, uden adgangskode."
      />
      <TeamManager members={members} devices={deviceList} businessName={business.name} />
    </>
  );
}
