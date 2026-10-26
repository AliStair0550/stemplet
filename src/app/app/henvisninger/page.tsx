import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel, SectionHeader, StatTile } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { formatDkNumber } from "@/lib/utils";
import { APP_URL } from "@/lib/env";
import { getReferralOverview } from "@/lib/referral-desk";
import { ReferralList } from "./ReferralList";
import { RuleForm } from "./RuleForm";

export const metadata: Metadata = { title: "Henvisninger" };
export const dynamic = "force-dynamic";

// Fanen Henvisninger (fase 3). Kun for butikker med modulet slaaet til; ellers
// en aegte 404, saa Stemplet-butikker aldrig ser den. Sproget er henvisningernes:
// ambassadoerer, henvisninger, beloenninger.
export default async function ReferralsPage() {
  const { business } = await requireBusiness();
  if (!business.referralsEnabled) notFound();

  const [overview, rule] = await Promise.all([
    getReferralOverview(business.id),
    prisma.referralRule.findUnique({ where: { businessId: business.id } }),
  ]);
  const pageUrl = `${APP_URL}/henvisninger/${business.slug}`;

  return (
    <>
      <PageHeading
        title="Henvisninger"
        subtitle="Dine kunder anbefaler dig. Her ser du hvem, og hvad du skylder."
        action={
          <a href="/api/henvisninger/eksport" className={btnClass("outline")}>
            Eksportér CSV
          </a>
        }
      />

      {!rule ? (
        <Panel className="mb-8">
          <p className="text-[0.95rem] text-ink">Sæt dine belønninger op for at komme i gang.</p>
          <p className="mt-1 text-[0.85rem] text-stone">
            Indtil da er henvisningssiden lukket for dine kunder.
          </p>
        </Panel>
      ) : null}

      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <StatTile label="Åbne henvisninger" value={formatDkNumber(overview.open)} sub="Venter på første besøg" />
        <StatTile
          label="Gennemført denne måned"
          value={formatDkNumber(overview.doneThisMonth)}
          sub="Nye kunder via en ven"
        />
        <StatTile
          label="Belønninger til gode"
          value={formatDkNumber(overview.pendingRewards)}
          sub={
            overview.pendingAmountKr > 0
              ? `${formatDkNumber(overview.pendingAmountKr)} kr. venter på indløsning`
              : "Venter på indløsning"
          }
        />
      </div>

      <section className="mb-10">
        <SectionHeader title="Nyeste henvisninger" />
        <ReferralList rows={overview.recent} hasPin={business.staffPin != null} />
      </section>

      <section className="mb-10">
        <SectionHeader title="Top-ambassadører" />
        <Panel>
          {overview.topAmbassadors.length === 0 ? (
            <p className="text-[0.88rem] text-stone">
              Når den første henvisning er gennemført, ser du dine ambassadører her.
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-fog">
              {overview.topAmbassadors.map((a, i) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-[0.92rem] text-ink">
                    <span className="mr-3 tabular-nums text-slate">{i + 1}.</span>
                    {a.name ?? "Uden navn"}
                    {a.code ? <span className="ml-2 text-[0.78rem] text-slate">{a.code}</span> : null}
                  </span>
                  <span className="text-[0.88rem] tabular-nums text-stone">
                    {a.referrals} {a.referrals === 1 ? "henvisning" : "henvisninger"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>

      <section>
        <SectionHeader title="Belønninger og betingelser" />
        <Panel>
          <p className="mb-5 text-[0.85rem] text-stone">
            Kundesiden:{" "}
            <a href={pageUrl} target="_blank" rel="noreferrer" className="text-terracotta underline underline-offset-2">
              {pageUrl}
            </a>
          </p>
          <RuleForm
            initial={{
              newCustomerRewardType: rule?.newCustomerRewardType ?? "AMOUNT",
              newCustomerRewardValue: rule?.newCustomerRewardValue ?? "100",
              referrerRewardType: rule?.referrerRewardType ?? "AMOUNT",
              referrerRewardValue: rule?.referrerRewardValue ?? "100",
              minPurchaseKr: rule?.minPurchaseKr?.toString() ?? "",
              maxReferralsPerMonth: rule?.maxReferralsPerMonth?.toString() ?? "5",
              rewardExpiryDays: (rule?.rewardExpiryDays ?? 180).toString(),
              termsLine: rule?.termsLine ?? "",
              bookingUrl: business.bookingUrl ?? "",
            }}
          />
        </Panel>
      </section>
    </>
  );
}
