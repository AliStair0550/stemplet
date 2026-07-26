import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  adminCodeConfigured,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDkNumber } from "@/lib/utils";
import { marketingSourceLabel } from "@/lib/marketing";
import { AdminUnlock } from "../AdminUnlock";
import { AdminShell } from "../AdminShell";
import { MarketingTable, type SignupRow } from "./MarketingTable";

export const metadata: Metadata = {
  title: "Marketing",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// Overblik over kommunikation: "hold mig orienteret"-tilmeldinger. Forberedt til
// et senere nyhedsbrevsmodul, men INGEN udsendelse/eksport/redigering af mails her.
const ROW_CAP = 500;

export default async function MarketingPage() {
  // Samme gate som /admin: kun superadmin, og kode-laasen skal vaere aabnet.
  const admin = await getSuperadminEmail();
  if (!admin) notFound();
  if (!(await isAdminUnlocked())) {
    return <AdminUnlock />;
  }
  const codeLock = adminCodeConfigured();

  const since7 = new Date();
  since7.setTime(since7.getTime() - 7 * 86_400_000);
  const since30 = new Date();
  since30.setTime(since30.getTime() - 30 * 86_400_000);

  const [totalSignups, newThisWeek, new30, sourceGroups, signups] =
    await Promise.all([
      prisma.marketingSignup.count(),
      prisma.marketingSignup.count({ where: { signedUpAt: { gte: since7 } } }),
      prisma.marketingSignup.count({ where: { signedUpAt: { gte: since30 } } }),
      prisma.marketingSignup.groupBy({
        by: ["source"],
        _count: { _all: true },
      }),
      prisma.marketingSignup.findMany({
        orderBy: { signedUpAt: "desc" },
        take: ROW_CAP,
      }),
    ]);

  const bySource = sourceGroups
    .map((g) => ({ label: marketingSourceLabel(g.source), n: g._count._all }))
    .sort((a, b) => b.n - a.n);

  const rows: SignupRow[] = signups.map((s) => ({
    id: s.id,
    name: s.name,
    storeName: s.storeName,
    email: s.email,
    source: marketingSourceLabel(s.source),
    signedUpAt: s.signedUpAt,
    confirmedAt: s.confirmedAt,
    status: s.status,
    note: s.note,
  }));

  const stat = [
    { label: "Tilmeldinger i alt", value: totalSignups },
    { label: "Nye denne uge", value: newThisWeek },
    { label: "Seneste 30 dage", value: new30 },
  ];

  return (
    <AdminShell admin={admin} codeLock={codeLock} active="marketing">
      <div className="flex flex-col gap-8">
        <p className="font-[300] text-[0.9rem] leading-relaxed text-slate">
          Al kommunikation med butiksejere ét sted. Tilmeldinger til &quot;hold
          mig orienteret&quot;, klar til et nyhedsbrev senere.
        </p>

        {/* Taellekort */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stat.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-fog bg-white p-5 shadow-card"
            >
              <p className="text-[0.66rem] font-[400] uppercase tracking-[0.14em] text-slate">
                {s.label}
              </p>
              <p className="mt-2 font-[300] text-[1.8rem] tabular-nums text-ink">
                {formatDkNumber(s.value)}
              </p>
            </div>
          ))}
        </div>

        {/* Fordeling pr. kilde */}
        <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
          <p className="text-[0.66rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Fordeling pr. kilde
          </p>
          {bySource.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {bySource.map((s) => (
                <span
                  key={s.label}
                  className="inline-flex items-center gap-2 rounded-full border border-fog bg-sand/50 px-3 py-1 text-[0.78rem] text-stone"
                >
                  {s.label}
                  <span className="font-[500] tabular-nums text-ink">{s.n}</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-2 font-[300] text-[0.88rem] text-slate">
              Ingen tilmeldinger endnu.
            </p>
          )}
        </div>

        {/* Tabel */}
        <section>
          <h2 className="font-[400] text-[0.95rem] tracking-[0.01em] text-ink">
            Tilmeldinger
          </h2>
          <p className="mt-1 font-[300] text-[0.82rem] leading-relaxed text-slate">
            Nyeste øverst. Sæt status og skriv en note pr. tilmelding.
            {totalSignups > ROW_CAP
              ? ` Viser de seneste ${ROW_CAP} af ${formatDkNumber(totalSignups)}.`
              : ""}
          </p>
          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
              Ingen tilmeldinger endnu. De dukker op her, så snart nogen skriver
              sig op via en af formularerne.
            </p>
          ) : (
            <MarketingTable rows={rows} />
          )}
        </section>
      </div>
    </AdminShell>
  );
}
