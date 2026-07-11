import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, type BusinessStats } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { CategoryBars } from "@/components/CategoryBars";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { UpgradePanel } from "../UpgradePanel";
import { stripeConfigured } from "@/lib/stripe";
import { formatDkNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

const pct = (n: number) => `${Math.round(n)}%`;

export default async function StatistikPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);
  const isPro = business.plan === "PRO";

  // Gratis-planen ser kun de to øverste tal. Resten sløres OG nulstilles,
  // saa de rigtige Pro-tal aldrig ligger i HTML'en.
  const previewStats: BusinessStats = {
    ...stats,
    stampsTotal: 0,
    redemptionsTotal: 0,
    redemptions30: 0,
    revisitRate: 0,
    completionRate: 0,
    avgDaysToFull: null,
    stampsWeek: 0,
    byMethod: { kiosk: 0, staff: 0, manual: 0 },
    perDay: stats.perDay.map((p) => ({ ...p, count: 0 })),
  };

  return (
    <>
      <PageHeading
        title="Statistik"
        subtitle="Hvordan dine kunder bruger kortet."
        action={
          isPro ? (
            <a
              href="/api/export/csv"
              className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-moss hover:opacity-70"
            >
              Eksporter CSV
            </a>
          ) : undefined
        }
      />

      {/* Alle ser de to første tal */}
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Aktive kunder"
          value={<AnimatedNumber value={stats.activeCustomers} />}
          sub={`${formatDkNumber(stats.totalCustomers)} i alt`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          value={<AnimatedNumber value={stats.newCustomers30} />}
        />
      </div>

      {isPro ? (
        <div className="mt-6">
          <FullStats stats={stats} />
        </div>
      ) : (
        <div className="relative mt-6">
          <div className="pointer-events-none select-none blur-[6px]" aria-hidden>
            <FullStats stats={previewStats} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-md">
              <UpgradePanel feature="Fuld statistik" enabled={stripeConfigured()} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FullStats({ stats }: { stats: BusinessStats }) {
  const methodData = [
    { label: "Kassens QR", value: stats.byMethod.kiosk },
    { label: "Personale-scan", value: stats.byMethod.staff },
    ...(stats.byMethod.manual > 0
      ? [{ label: "Manuelt", value: stats.byMethod.manual }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Stempler i alt"
          value={<AnimatedNumber value={stats.stampsTotal} />}
        />
        <StatTile
          label="Indløsninger"
          value={<AnimatedNumber value={stats.redemptionsTotal} />}
        />
        <StatTile
          label="Genbesøgsrate"
          value={<AnimatedNumber value={stats.revisitRate * 100} format={pct} />}
          sub="kunder der kom igen"
        />
        <StatTile
          label="Tid til fuldt kort"
          value={
            stats.avgDaysToFull !== null ? (
              <AnimatedNumber
                value={stats.avgDaysToFull}
                format={(n) => `${(Math.round(n * 10) / 10).toString()} dage`}
              />
            ) : (
              "-"
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Stempler pr. dag (14 dage)
          </h2>
          <BarChart data={stats.perDay} />
        </Panel>
        <Panel>
          <h2 className="mb-1 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Sådan bliver der stemplet
          </h2>
          <p className="mb-4 text-[0.72rem] font-[200] text-slate">
            Fordeling af stempler pr. metode.
          </p>
          <CategoryBars data={methodData} />
        </Panel>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Gennemførelsesrate"
          value={
            <AnimatedNumber value={stats.completionRate * 100} format={pct} />
          }
          sub="kort der blev fyldt"
        />
        <StatTile
          label="Stempler seneste 7 dage"
          value={<AnimatedNumber value={stats.stampsWeek} />}
        />
      </div>
    </div>
  );
}
