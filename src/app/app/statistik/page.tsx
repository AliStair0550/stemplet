import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, type BusinessStats } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { LoyaltyPanel } from "@/components/LoyaltyPanel";
import { formatDkNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Statistik" };
export const dynamic = "force-dynamic";

// Ugens stempler mod ugen foer, udledt af de 14 dags-buckets.
function weekMomentum(stats: BusinessStats) {
  const thisWeek = stats.perDay.slice(-7).reduce((s, d) => s + d.count, 0);
  const lastWeek = stats.perDay.slice(-14, -7).reduce((s, d) => s + d.count, 0);
  const delta = thisWeek - lastWeek;
  const pct = lastWeek > 0 ? Math.round((delta / lastWeek) * 100) : null;
  return { thisWeek, lastWeek, delta, pct };
}

// En kort, menneskelig konklusion ud fra tallene, saa ejeren straks ved hvor de
// staar uden at skulle tolke tal selv.
function summarize(stats: BusinessStats): { headline: string; body: string } {
  const { totalCustomers, activeCustomers, stampsTotal, loyalty } = stats;
  const { thisWeek, lastWeek, pct } = weekMomentum(stats);

  const headline =
    pct !== null && pct > 0
      ? "Det går fremad"
      : pct !== null && pct < 0
        ? "Lidt roligere denne uge"
        : thisWeek > 0
          ? "Godt i gang"
          : "Klar til flere stempler";

  const sentences: string[] = [];
  sentences.push(
    `Du har ${formatDkNumber(totalCustomers)} ${totalCustomers === 1 ? "kortholder" : "kortholdere"} ude${
      totalCustomers >= 100 ? ", over 100" : ""
    }, og ${formatDkNumber(activeCustomers)} ${activeCustomers === 1 ? "er aktiv" : "er aktive"} lige nu.`,
  );

  let stampsSentence = `Der er givet ${formatDkNumber(stampsTotal)} ${stampsTotal === 1 ? "stempel" : "stempler"} i alt.`;
  if (thisWeek > 0 || lastWeek > 0) {
    if (pct !== null && pct > 0) {
      stampsSentence += ` Denne uge kom der ${formatDkNumber(thisWeek)}, ${pct}% flere end ugen før.`;
    } else if (pct !== null && pct < 0) {
      stampsSentence += ` Denne uge kom der ${formatDkNumber(thisWeek)}, ${Math.abs(pct)}% færre end ugen før.`;
    } else {
      stampsSentence += ` Denne uge kom der ${formatDkNumber(thisWeek)}.`;
    }
  }
  sentences.push(stampsSentence);

  if (loyalty.topStamps > 0) {
    sentences.push(
      `Din mest loyale kunde har ${formatDkNumber(loyalty.topStamps)} stempler${
        loyalty.over100 > 0
          ? `, og ${formatDkNumber(loyalty.over100)} ${loyalty.over100 === 1 ? "kunde har" : "kunder har"} rundet 100`
          : ""
      }.`,
    );
  }

  return { headline, body: sentences.join(" ") };
}

export default async function StatistikPage() {
  const { business } = await requireBusiness();
  const stats = await getBusinessStats(business.id);
  const started = stats.totalCustomers > 0;
  const summary = summarize(stats);

  return (
    <>
      <PageHeading
        title="Statistik"
        subtitle="Dit overblik på ét sted, med en kort konklusion øverst."
        action={
          <a
            href="/api/export/csv"
            className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-terracotta hover:opacity-70"
          >
            Eksporter CSV
          </a>
        }
      />

      {started ? (
        <div className="mb-6 overflow-hidden rounded-lg border border-terracotta/30 bg-terracotta/[0.06]">
          <div className="flex flex-col gap-2 p-6 md:p-7">
            <span className="text-label font-[400] uppercase tracking-[0.14em] text-terracotta">
              Kort fortalt
            </span>
            <h2 className="font-fraunces text-[1.5rem] font-light italic text-ink">
              {summary.headline}
            </h2>
            <p className="max-w-2xl font-[300] text-[0.95rem] leading-relaxed text-stone">
              {summary.body}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-terracotta/30 bg-terracotta/5 px-5 py-4">
          <p className="text-[0.9rem] font-[300] text-terracotta">
            Her kommer dit overblik, så snart de første kort er hentet.
          </p>
          <p className="mt-1 text-[0.82rem] font-[200] leading-relaxed text-stone">
            Sæt din QR-kode op ved kassen. Så snart kunderne henter kortet og
            får stempler, fyldes konklusion, nøgletal og grafer automatisk.
          </p>
        </div>
      )}

      {/* Nøgletal med tydelige, selvforklarende etiketter */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Kortholdere i alt"
          value={<AnimatedNumber value={stats.totalCustomers} />}
          sub="kort ude siden start"
        />
        <StatTile
          label="Aktive kunder"
          value={<AnimatedNumber value={stats.activeCustomers} />}
          sub="stemplet seneste 60 dage"
        />
        <StatTile
          label="Stempler i alt"
          value={<AnimatedNumber value={stats.stampsTotal} />}
          sub="givet til kunderne"
        />
        <StatTile
          label="Indløste belønninger"
          value={<AnimatedNumber value={stats.redemptionsTotal} />}
          sub={`${formatDkNumber(stats.redemptions30)} seneste 30 dage`}
        />
      </div>

      <div className="mt-6">
        <FullStats stats={stats} />
      </div>
    </>
  );
}

function FullStats({ stats }: { stats: BusinessStats }) {
  return (
    <div className="flex flex-col gap-6">
      <LoyaltyPanel loyalty={stats.loyalty} />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel>
          <h2 className="mb-1 text-label font-[400] uppercase tracking-[0.14em] text-slate">
            Stempler seneste 7 dage
          </h2>
          <p className="mb-4 text-[0.74rem] font-[300] text-stone">
            Faktiske stempler givet pr. dag.
          </p>
          <BarChart
            data={stats.perDay.slice(-7).map((d) => ({
              label: d.label,
              count: d.count,
              sublabel: d.weekday,
            }))}
          />
        </Panel>
        <Panel>
          <h2 className="mb-1 text-label font-[400] uppercase tracking-[0.14em] text-slate">
            Nye kunder seneste 7 dage
          </h2>
          <p className="mb-4 text-[0.74rem] font-[300] text-stone">
            Nye kort hentet pr. dag.
          </p>
          <BarChart
            data={stats.newPerDay.slice(-7).map((d) => ({
              label: d.label,
              count: d.count,
              sublabel: d.weekday,
            }))}
          />
        </Panel>
      </div>

      {/* Kvalitets-mål: hvor godt kortet virker */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Nye kunder (30 dage)"
          value={<AnimatedNumber value={stats.newCustomers30} />}
          sub={`${formatDkNumber(stats.newCustomers7)} seneste 7 dage`}
        />
        <StatTile
          label="Genbesøgsrate"
          value={<AnimatedNumber value={stats.revisitRate * 100} format="percent" />}
          sub="kom igen efter første stempel"
        />
        <StatTile
          label="Gennemførelsesrate"
          value={
            <AnimatedNumber value={stats.completionRate * 100} format="percent" />
          }
          sub="fyldte mindst ét kort"
        />
        <StatTile
          label="Tid til fuldt kort"
          value={
            stats.avgDaysToFull !== null ? (
              <AnimatedNumber
                value={stats.avgDaysToFull}
                suffix=" dage"
                decimals={1}
              />
            ) : (
              "-"
            )
          }
          sub="i snit pr. kort"
        />
      </div>
    </div>
  );
}
