import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, type BusinessStats } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { CategoryBars } from "@/components/CategoryBars";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { formatDkNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

const pct = (n: number) => `${Math.round(n)}%`;

export default async function StatistikPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);

  return (
    <>
      <PageHeading
        title="Statistik"
        subtitle="Hvordan dine kunder bruger kortet."
        action={
          <a
            href="/api/export/csv"
            className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-moss hover:opacity-70"
          >
            Eksporter CSV
          </a>
        }
      />

      {stats.stampsTotal === 0 ? (
        <div className="mb-6 rounded-sm border border-moss/30 bg-moss/5 px-5 py-4">
          <p className="text-[0.9rem] font-[300] text-moss">
            Her kommer dine tal, så snart der bliver stemplet.
          </p>
          <p className="mt-1 text-[0.82rem] font-[200] leading-relaxed text-stone">
            Sæt din QR-kode op ved kassen og giv de første stempler — så fyldes
            grafer og nøgletal automatisk. Der er ikke noget galt; du er bare
            lige startet.
          </p>
        </div>
      ) : null}

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

      <div className="mt-6">
        <FullStats stats={stats} />
      </div>
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
          sub="kunder der fyldte et kort"
        />
        <StatTile
          label="Stempler seneste 7 dage"
          value={<AnimatedNumber value={stats.stampsWeek} />}
        />
      </div>
    </div>
  );
}
