import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, type BusinessStats } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { UpgradePanel } from "../UpgradePanel";
import { formatDkNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

export default async function StatistikPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);
  const isPro = business.plan === "PRO";

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

      {/* Alle ser de to foerste tal */}
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Aktive kunder"
          value={formatDkNumber(stats.activeCustomers)}
          sub={`${formatDkNumber(stats.totalCustomers)} i alt`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          value={formatDkNumber(stats.newCustomers30)}
        />
      </div>

      {isPro ? (
        <div className="mt-6">
          <FullStats stats={stats} />
        </div>
      ) : (
        <div className="relative mt-6">
          <div className="pointer-events-none select-none blur-[6px]" aria-hidden>
            <FullStats stats={stats} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full max-w-md">
              <UpgradePanel feature="Fuld statistik" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FullStats({ stats }: { stats: BusinessStats }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Stempler i alt"
          value={formatDkNumber(stats.stampsTotal)}
        />
        <StatTile
          label="Indloesninger"
          value={formatDkNumber(stats.redemptionsTotal)}
        />
        <StatTile
          label="Genbesoegsrate"
          value={`${Math.round(stats.revisitRate * 100)}%`}
          sub="kunder der kom igen"
        />
        <StatTile
          label="Tid til fuldt kort"
          value={stats.avgDaysToFull !== null ? `${stats.avgDaysToFull} dage` : "-"}
        />
      </div>
      <Panel>
        <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Stempler pr. dag (14 dage)
        </h2>
        <BarChart data={stats.perDay} />
      </Panel>
      <div className="grid grid-cols-2 gap-4">
        <StatTile
          label="Gennemfoerelsesrate"
          value={`${Math.round(stats.completionRate * 100)}%`}
          sub="kort der blev fyldt"
        />
        <StatTile
          label="Stempler seneste 7 dage"
          value={formatDkNumber(stats.stampsWeek)}
        />
      </div>
    </div>
  );
}
