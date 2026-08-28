import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  adminCodeConfigured,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";
import { APP_URL } from "@/lib/env";
import { AdminUnlock } from "../AdminUnlock";
import { AdminShell } from "../AdminShell";
import { AdminQrGrid, type QrItem } from "./AdminQrGrid";

export const metadata: Metadata = {
  title: "QR-koder",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminQrPage() {
  const admin = await getSuperadminEmail();
  if (!admin) notFound();
  if (!(await isAdminUnlocked())) {
    return <AdminUnlock />;
  }
  const codeLock = adminCodeConfigured();

  // Alle rigtige butikker (demoen holdes ude, som i resten af admin).
  const businesses = await prisma.business.findMany({
    where: { slug: { not: DEMO_SLUG } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      memberships: {
        select: { user: { select: { email: true } } },
        take: 1,
      },
    },
  });

  const items: QrItem[] = await Promise.all(
    businesses.map(async (b) => {
      const cardUrl = `${APP_URL}/k/${b.slug}`;
      const qrDataUrl = await QRCode.toDataURL(cardUrl, {
        margin: 1,
        width: 320,
        color: { dark: "#1A1A1A", light: "#FFFFFF" },
      });
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        cardUrl,
        qrDataUrl,
        owner: b.memberships[0]?.user.email ?? null,
      };
    }),
  );

  return (
    <AdminShell admin={admin} codeLock={codeLock} active="qr">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-[400] text-[0.95rem] tracking-[0.01em] text-ink">
            QR-koder ({items.length})
          </h2>
          <p className="mt-1 max-w-2xl font-[300] text-[0.82rem] leading-relaxed text-slate">
            Hver butiks QR-kode, kortlink og ejer-email. Søg en butik frem, hent
            QR-koden eller et printklart materiale, og send det til dem, hvis de
            har brug for hjælp.
          </p>
        </div>
        {items.length === 0 ? (
          <p className="rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
            Ingen butikker endnu.
          </p>
        ) : (
          <AdminQrGrid items={items} />
        )}
      </div>
    </AdminShell>
  );
}
