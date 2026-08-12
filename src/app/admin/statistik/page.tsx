import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  adminCodeConfigured,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";
import {
  formatDkNumber,
  formatDkDate,
  formatDkDateTime,
} from "@/lib/utils";
import { BarChart } from "@/components/BarChart";
import { AdminUnlock } from "../AdminUnlock";
import { AdminShell } from "../AdminShell";

export const metadata: Metadata = {
  title: "Statistik",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

// Aar-maaned-noegle i UTC (fx "2026-07"). Maaneds-granularitet, saa UTC vs. lokal
// tid kun kan flytte en enkelt tilmelding paa selve maanedsskiftet, hvilket er
// uden betydning for et vaekst-overblik.
function ymKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Byg et n-maaneders soejle-datasaet (aeldste til nyeste) fra en ym -> antal-map.
function buildMonthSeries(
  byYm: Map<string, number>,
  n: number,
): { label: string; count: number; sublabel: string }[] {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("da-DK", {
    month: "short",
    timeZone: "UTC",
  });
  const out: { label: string; count: number; sublabel: string }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const label = fmt.format(d).replace(".", "");
    out.push({ label, sublabel: label, count: byYm.get(ymKey(d)) ?? 0 });
  }
  return out;
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="font-[400] text-[0.95rem] tracking-[0.01em] text-ink">
        {title}
      </h2>
      <p className="mt-1 font-[300] text-[0.82rem] leading-relaxed text-slate">
        {desc}
      </p>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
      <p className="text-[0.66rem] font-[400] uppercase tracking-[0.14em] text-slate">
        {label}
      </p>
      <p className="mt-2 font-[300] text-[1.8rem] tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

// Vandret funnel: hvert trin som en bar relativt til det foerste trin, med
// antal og andel. Goer frafald let at se.
function Funnel({ steps }: { steps: { label: string; count: number }[] }) {
  const top = Math.max(1, steps[0]?.count ?? 0);
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-fog bg-white p-5 shadow-card">
      {steps.map((s) => {
        const pct = Math.round((s.count / top) * 100);
        return (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-36 shrink-0 truncate text-[0.8rem] font-[300] text-stone">
              {s.label}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded bg-fog/60">
              <div
                className="h-full rounded bg-terracotta/80"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-[0.82rem] tabular-nums text-ink">
              {formatDkNumber(s.count)}
              <span className="ml-1 font-[300] text-slate">{pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default async function StatistikPage() {
  const admin = await getSuperadminEmail();
  if (!admin) notFound();
  if (!(await isAdminUnlocked())) {
    return <AdminUnlock />;
  }
  const codeLock = adminCodeConfigured();

  const since30 = new Date();
  since30.setTime(since30.getTime() - 30 * 86_400_000);

  // Kun rigtige butikker (demoen holdes helt ude af platform-statistikken).
  const businesses = await prisma.business.findMany({
    where: { slug: { not: DEMO_SLUG } },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      createdAt: true,
      cards: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const businessIds = businesses.map((b) => b.id);
  const cardToBiz = new Map<string, string>();
  for (const b of businesses) for (const c of b.cards) cardToBiz.set(c.id, b.id);
  const cardIds = [...cardToBiz.keys()];

  const [
    cardCounts,
    stampAgg,
    redemptionsTotal,
    newCardholders30,
    chMonthRows,
    onbRows,
    deviceRows,
  ] = await Promise.all([
    prisma.customerCard.groupBy({
      by: ["cardId"],
      where: { cardId: { in: cardIds } },
      _count: { _all: true },
    }),
    prisma.stamp.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _sum: { multiplier: true },
      _max: { createdAt: true },
    }),
    prisma.redemption.count({
      where: { customerCard: { card: { businessId: { in: businessIds } } } },
    }),
    prisma.customerCard.count({
      where: { createdAt: { gte: since30 }, cardId: { in: cardIds } },
    }),
    businessIds.length
      ? prisma.$queryRaw<{ ym: string; n: number }[]>(Prisma.sql`
            SELECT to_char(date_trunc('month', cc."createdAt"), 'YYYY-MM') AS ym,
                   COUNT(*)::int AS n
            FROM "CustomerCard" cc
            JOIN "Card" c ON c."id" = cc."cardId"
            WHERE c."businessId" IN (${Prisma.join(businessIds)})
            GROUP BY 1
          `)
      : Promise.resolve([] as { ym: string; n: number }[]),
    // Onboarding-funnel: distinkte anonyme besoegende pr. trin, seneste 30 dage.
    prisma.onboardingEvent.groupBy({
      by: ["step"],
      where: { createdAt: { gte: since30 } },
      _count: { _all: true },
    }),
    // Aktivering: butikker med mindst een aktiv kasse-enhed.
    businessIds.length
      ? prisma.device.groupBy({
          by: ["businessId"],
          where: { businessId: { in: businessIds }, revokedAt: null },
          _count: { _all: true },
        })
      : Promise.resolve([] as { businessId: string }[]),
  ]);

  const customersByBiz = new Map<string, number>();
  for (const g of cardCounts) {
    const biz = cardToBiz.get(g.cardId);
    if (biz) customersByBiz.set(biz, (customersByBiz.get(biz) ?? 0) + g._count._all);
  }
  const stampsByBiz = new Map<string, number>();
  const lastByBiz = new Map<string, Date | null>();
  for (const g of stampAgg) {
    if (!g.businessId) continue;
    stampsByBiz.set(g.businessId, g._sum.multiplier ?? 0);
    lastByBiz.set(g.businessId, g._max.createdAt ?? null);
  }

  const totalCardholders = [...customersByBiz.values()].reduce((a, b) => a + b, 0);
  const totalStamps = [...stampsByBiz.values()].reduce((a, b) => a + b, 0);
  const newBiz30 = businesses.filter((b) => b.createdAt >= since30).length;

  // Oprettelses-funnel (seneste 30 dage): hvor mange naaede hvert trin paa /start.
  const onbByStep = new Map<number, number>();
  for (const r of onbRows) onbByStep.set(r.step, r._count._all);
  const onboardingFunnel = [
    { label: "1. Din butik", count: onbByStep.get(0) ?? 0 },
    { label: "2. Design", count: onbByStep.get(1) ?? 0 },
    { label: "3. Opsætning", count: onbByStep.get(2) ?? 0 },
    { label: "4. Oprettet", count: onbByStep.get(3) ?? 0 },
  ];

  // Aktivering: af alle oprettede butikker, hvor mange kom videre.
  const bizWithDevice = new Set(deviceRows.map((d) => d.businessId));
  const activationFunnel = [
    { label: "Oprettet", count: businesses.length },
    { label: "Tilføjet medarbejder", count: bizWithDevice.size },
    { label: "Første kortholder", count: customersByBiz.size },
    { label: "Første stempel", count: stampsByBiz.size },
  ];

  // Vaekst pr. maaned (seneste 6).
  const bizByYm = new Map<string, number>();
  for (const b of businesses) {
    bizByYm.set(ymKey(b.createdAt), (bizByYm.get(ymKey(b.createdAt)) ?? 0) + 1);
  }
  const chByYm = new Map(chMonthRows.map((r) => [r.ym, Number(r.n)]));
  const bizSeries = buildMonthSeries(bizByYm, 6);
  const chSeries = buildMonthSeries(chByYm, 6);

  const rows = businesses.map((b) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    plan: b.plan,
    createdAt: b.createdAt,
    cardholders: customersByBiz.get(b.id) ?? 0,
    stamps: stampsByBiz.get(b.id) ?? 0,
    lastActive: lastByBiz.get(b.id) ?? null,
  }));

  const kpi = [
    { label: "Butikker", value: businesses.length },
    { label: "Kortholdere", value: totalCardholders },
    { label: "Stempler", value: totalStamps },
    { label: "Indløsninger", value: redemptionsTotal },
  ];

  return (
    <AdminShell admin={admin} codeLock={codeLock} active="statistik">
      <div className="flex flex-col gap-10">
        <p className="font-[300] text-[0.9rem] leading-relaxed text-slate">
          Overblik og udvikling for hele platformen. Kun rigtige butikker (demo
          tælles ikke med). Til dig selv og til fremtidige investorer.
        </p>

        {/* Noegletal */}
        <section>
          <SectionHead
            title="Nøgletal"
            desc="Samlet status på tværs af alle rigtige butikker."
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpi.map((k) => (
              <Kpi key={k.label} label={k.label} value={formatDkNumber(k.value)} />
            ))}
          </div>
        </section>

        {/* Vaekst */}
        <section>
          <SectionHead
            title="Vækst"
            desc="Nye butikker og nye kortholdere pr. måned, seneste 6 måneder."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
              <div className="mb-5 flex items-baseline justify-between">
                <p className="text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                  Nye butikker pr. måned
                </p>
                <p className="font-[300] text-[0.78rem] text-slate">
                  {formatDkNumber(newBiz30)} seneste 30 dage
                </p>
              </div>
              <BarChart data={bizSeries} />
            </div>
            <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
              <div className="mb-5 flex items-baseline justify-between">
                <p className="text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                  Nye kortholdere pr. måned
                </p>
                <p className="font-[300] text-[0.78rem] text-slate">
                  {formatDkNumber(newCardholders30)} seneste 30 dage
                </p>
              </div>
              <BarChart data={chSeries} />
            </div>
          </div>
        </section>

        {/* Onboarding & aktivering */}
        <section>
          <SectionHead
            title="Onboarding & aktivering"
            desc="Hvor mange når hvert trin i oprettelsen (seneste 30 dage), og hvor mange butikker kommer videre bagefter. Vis, hvor folk falder fra."
          />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                Oprettelses-funnel (30 dage)
              </p>
              <Funnel steps={onboardingFunnel} />
            </div>
            <div>
              <p className="mb-2 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                Aktivering efter oprettelse
              </p>
              <Funnel steps={activationFunnel} />
            </div>
          </div>
        </section>

        {/* Alle butikker (read-only) */}
        <section>
          <SectionHead
            title={`Alle butikker (${businesses.length})`}
            desc="Hvem er oprettet hvornår, plan, kortholdere, stempler og sidste aktivitet. Nyeste øverst."
          />
          {rows.length === 0 ? (
            <p className="mt-4 rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
              Ingen rigtige butikker endnu.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-lg border border-fog bg-white shadow-card">
              <table className="w-full min-w-[720px] border-collapse text-left text-[0.84rem]">
                <thead>
                  <tr className="border-b border-fog text-[0.62rem] uppercase tracking-[0.1em] text-slate">
                    <th className="px-4 py-3 font-[500]">Butik</th>
                    <th className="px-4 py-3 font-[500]">Oprettet</th>
                    <th className="px-4 py-3 font-[500]">Plan</th>
                    <th className="px-4 py-3 text-right font-[500]">Kortholdere</th>
                    <th className="px-4 py-3 text-right font-[500]">Stempler</th>
                    <th className="px-4 py-3 font-[500]">Sidst aktiv</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-fog/70">
                      <td className="px-4 py-3">
                        <span className="block font-[400] text-ink">{r.name}</span>
                        <span className="block font-[300] text-[0.76rem] text-slate">
                          /{r.slug}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-[300] text-slate">
                        {formatDkDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-[500] uppercase tracking-[0.06em] ${
                            r.plan === "PRO"
                              ? "border-terracotta/40 bg-terracotta/5 text-terracotta"
                              : "border-fog bg-sand/60 text-slate"
                          }`}
                        >
                          {r.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">
                        {formatDkNumber(r.cardholders)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">
                        {formatDkNumber(r.stamps)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-[300] text-slate">
                        {r.lastActive ? formatDkDateTime(r.lastActive) : "Ingen"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
