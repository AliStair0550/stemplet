import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuperadminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatDkNumber, formatDkDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Row = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  createdAt: Date;
  hasLocation: boolean;
  emails: string[];
  customers: number;
  stamps: number;
  redemptions: number;
};

export default async function AdminPage() {
  // Kun superadmin (SUPERADMIN_EMAIL). Alle andre faar 404, saa siden ikke
  // engang roeber, at den findes.
  const admin = await getSuperadminEmail();
  if (!admin) notFound();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { email: true } },
      cards: { select: { id: true } },
    },
  });

  // Faa butikker i opstart: enkle tael-forespoergsler pr. butik er rigeligt.
  // (Kan optimeres til groupBy, hvis platformen vokser.)
  const rows: Row[] = await Promise.all(
    businesses.map(async (b) => {
      const cardIds = b.cards.map((c) => c.id);
      const where = { customerCard: { cardId: { in: cardIds } } };
      const [customers, stamps, redemptions] = await Promise.all([
        prisma.customerCard.count({ where: { cardId: { in: cardIds } } }),
        cardIds.length ? prisma.stamp.count({ where }) : Promise.resolve(0),
        cardIds.length ? prisma.redemption.count({ where }) : Promise.resolve(0),
      ]);
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        plan: b.plan,
        createdAt: b.createdAt,
        hasLocation: b.latitude != null && b.longitude != null,
        emails: b.users.map((u) => u.email).filter(Boolean) as string[],
        customers,
        stamps,
        redemptions,
      };
    }),
  );

  const totals = rows.reduce(
    (a, r) => ({
      businesses: a.businesses + 1,
      customers: a.customers + r.customers,
      stamps: a.stamps + r.stamps,
      redemptions: a.redemptions + r.redemptions,
    }),
    { businesses: 0, customers: 0, stamps: 0, redemptions: 0 },
  );

  const stat = [
    { label: "Butikker", value: totals.businesses },
    { label: "Kunder", value: totals.customers },
    { label: "Stempler", value: totals.stamps },
    { label: "Indløsninger", value: totals.redemptions },
  ];

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[300] text-[1.6rem] tracking-[0.02em] text-ink">
              Platform-overblik
            </h1>
            <p className="mt-1 font-[300] text-[0.85rem] text-slate">
              Logget ind som {admin}
            </p>
          </div>
          <Link
            href="/app"
            className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-moss transition-colors hover:text-moss-light"
          >
            Til dashboard
          </Link>
        </div>

        {/* Noegletal */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

        {/* Butikstabel */}
        <div className="mt-8 overflow-x-auto rounded-lg border border-fog bg-white shadow-card">
          <table className="w-full min-w-[720px] text-left text-[0.85rem]">
            <thead>
              <tr className="border-b border-fog text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                <th className="px-5 py-3.5 font-[500]">Butik</th>
                <th className="px-5 py-3.5 font-[500]">Ejer</th>
                <th className="px-5 py-3.5 font-[500]">Plan</th>
                <th className="px-5 py-3.5 text-right font-[500]">Kunder</th>
                <th className="px-5 py-3.5 text-right font-[500]">Stempler</th>
                <th className="px-5 py-3.5 text-right font-[500]">Indløst</th>
                <th className="px-5 py-3.5 font-[500]">Placering</th>
                <th className="px-5 py-3.5 font-[500]">Oprettet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-fog/60 last:border-0 hover:bg-sand/40"
                >
                  <td className="px-5 py-3.5">
                    <span className="font-[400] text-ink">{r.name}</span>
                    <span className="ml-2 font-[300] text-[0.76rem] text-slate">
                      /{r.slug}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-[300] text-stone">
                    {r.emails.join(", ") || "-"}
                  </td>
                  <td className="px-5 py-3.5 font-[300] text-stone">{r.plan}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                    {formatDkNumber(r.customers)}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                    {formatDkNumber(r.stamps)}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums text-ink">
                    {formatDkNumber(r.redemptions)}
                  </td>
                  <td className="px-5 py-3.5 font-[300] text-stone">
                    {r.hasLocation ? "Ja" : "Nej"}
                  </td>
                  <td className="px-5 py-3.5 font-[300] text-slate">
                    {formatDkDateTime(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 font-[300] text-[0.9rem] text-slate">
            Ingen butikker endnu.
          </p>
        ) : null}
      </div>
    </main>
  );
}
