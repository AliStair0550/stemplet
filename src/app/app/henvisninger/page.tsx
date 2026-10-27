import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Panel, SectionHeader, StatTile } from "@/components/dash";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { btnClass } from "@/components/ui";
import { formatDkNumber } from "@/lib/utils";
import { getReferralOverview } from "@/lib/referral-desk";
import { ReferralList } from "./ReferralList";

export const metadata: Metadata = { title: "Henvisninger" };
export const dynamic = "force-dynamic";

// Produktets logo oeverst (som Stemplet), med en valgfri handling til hoejre.
function ReferralHeader({ action }: { action?: React.ReactNode }) {
  return (
    <header className="mb-8 flex items-end justify-between gap-4 border-b border-fog pb-6">
      <div>
        <h1>
          <HenvisningerLogo className="h-[2.9rem] -ml-1" />
        </h1>
        <p className="mt-2 font-[300] text-[0.95rem] text-stone">Dine kunder anbefaler dig.</p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

// Fanen Henvisninger (fase 3). Kun for butikker med modulet slaaet til; ellers
// en aegte 404, saa Stemplet-butikker aldrig ser den. Bevidst enkel: tre tal,
// listen og de bedste ambassadoerer. Opsaetningen ligger paa sin egen side.
export default async function ReferralsPage() {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) notFound();

  const settings = (
    <Link href="/app/henvisninger/indstillinger" className={btnClass("outline")}>
      Indstillinger
    </Link>
  );

  const rule = await prisma.referralRule.findUnique({
    where: { businessId: business.id },
    select: { id: true },
  });
  if (!rule) {
    return (
      <>
        <ReferralHeader />
        <Panel>
          <p className="text-[1.05rem] text-ink">Sæt dine belønninger op for at komme i gang.</p>
          <p className="mt-1 text-[0.88rem] text-stone">
            Bestem hvad den nye kunde og ambassadøren får. Indtil da er henvisningssiden lukket.
          </p>
          <Link href="/app/henvisninger/indstillinger" className={`${btnClass("primary")} mt-5`}>
            Sæt belønninger op
          </Link>
        </Panel>
      </>
    );
  }

  const overview = await getReferralOverview(business.id);
  const top = overview.topAmbassadors.slice(0, 5);

  return (
    <>
      <ReferralHeader action={settings} />

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Venter på besøg" value={formatDkNumber(overview.open)} />
        <StatTile label="Nye kunder denne måned" value={formatDkNumber(overview.doneThisMonth)} />
        <StatTile
          label="Belønninger til gode"
          value={formatDkNumber(overview.pendingRewards)}
          sub={
            overview.pendingAmountKr > 0
              ? `${formatDkNumber(overview.pendingAmountKr)} kr. i alt`
              : undefined
          }
        />
      </div>

      <section className="mb-10">
        <SectionHeader
          title="Seneste henvisninger"
          action={
            <a
              href="/api/henvisninger/eksport"
              className="text-[0.74rem] font-[400] uppercase tracking-[0.08em] text-ink underline-offset-4 hover:underline"
            >
              Eksportér
            </a>
          }
        />
        <ReferralList rows={overview.recent} hasPin={business.staffPin != null} />
      </section>

      {top.length > 0 ? (
        <section>
          <SectionHeader title="Bedste ambassadører" />
          <Panel>
            <ol className="flex flex-col divide-y divide-fog">
              {top.map((a, i) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-ink">
                    <span className="mr-3 tabular-nums text-slate">{i + 1}.</span>
                    {a.name ?? a.code ?? "Uden navn"}
                  </span>
                  <span className="text-[0.88rem] tabular-nums text-stone">
                    {a.referrals} {a.referrals === 1 ? "ny kunde" : "nye kunder"}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        </section>
      ) : null}
    </>
  );
}
