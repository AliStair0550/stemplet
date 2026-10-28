import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { PageHeading, Panel, SectionHeader, StatTile } from "@/components/dash";
import { formatDkNumber } from "@/lib/utils";
import { getReferralOverview } from "@/lib/referral-desk";

export const metadata: Metadata = { title: "Statistik for henvisninger" };
export const dynamic = "force-dynamic";

// Tallene for henvisninger og de bedste ambassadoerer, flyttet fra Overblik, saa
// Overblik kan vaere en ren arbejdsliste.
export default async function ReferralStatsPage() {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) redirect("/app/henvisninger/tilfoej");
  const o = await getReferralOverview(business.id);

  return (
    <>
      <PageHeading
        title="Statistik"
        subtitle="Hvordan dine kunder anbefaler dig."
        action={
          <a
            href="/api/henvisninger/eksport"
            className="text-[0.8rem] font-[500] text-ink underline-offset-4 hover:underline"
          >
            Eksportér CSV
          </a>
        }
      />

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Venter på besøg" value={formatDkNumber(o.open)} />
        <StatTile label="Nye kunder denne måned" value={formatDkNumber(o.doneThisMonth)} />
        <StatTile
          label="Belønninger til gode"
          value={formatDkNumber(o.pendingRewards)}
          sub={o.pendingAmountKr > 0 ? `${formatDkNumber(o.pendingAmountKr)} kr. i alt` : undefined}
        />
      </div>

      <section>
        <SectionHeader title="Bedste ambassadører" />
        <Panel>
          {o.topAmbassadors.length === 0 ? (
            <p className="text-[0.88rem] text-stone">
              Når den første henvisning er gennemført, ser du dine ambassadører her.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-fog">
              {o.topAmbassadors.map((a, i) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-ink">
                    <span className="mr-3 tabular-nums text-slate">{i + 1}.</span>
                    {a.name ?? a.code ?? "Uden navn"}
                    {a.code ? <span className="ml-2 text-[0.78rem] text-slate">{a.code}</span> : null}
                  </span>
                  <span className="text-[0.88rem] tabular-nums text-stone">
                    {a.referrals} {a.referrals === 1 ? "ny kunde" : "nye kunder"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>
    </>
  );
}
