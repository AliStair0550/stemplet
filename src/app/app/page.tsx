import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity, getOverviewPulse } from "@/lib/stats";
import { getReferralOverview, type ReferralRow } from "@/lib/referral-desk";
import { greetingFor, referralSummaryLine, summaryLine } from "@/lib/overview-text";
import { StempletLogo, HenvisningerLogo } from "@/components/ProductLogo";
import { Panel, SectionHeader } from "@/components/dash";
import { cn, formatDkNumber, relativeDk } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Hjem: det faelles overblik over butikken. Et kort pr. produkt med dagens tal
// (klik ind for detaljer) og een aktivitetsliste paa tvaers, hvor prikken viser
// produktet (Stemplet terracotta, Henvisninger sort).

const STAMP_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

type Activity = {
  id: string;
  at: Date;
  text: string;
  product: "stemplet" | "henvisninger";
  alert?: boolean;
};

function referralText(r: ReferralRow): string {
  const referrer = r.referrer.name ?? r.referrer.code ?? "En kunde";
  const referred = r.referred.name ?? "en ny kunde";
  switch (r.status) {
    case "REWARDED":
      return `${referred} kom via ${referrer}. Første besøg registreret.`;
    case "CREATED":
    case "VISITED":
      return `${referrer} har henvist ${referred}.`;
    case "EXPIRED":
      return `Henvisningen af ${referred} er udløbet.`;
    default:
      return `Henvisningen af ${referred} er annulleret.`;
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <span>
      <span className="block text-[1.9rem] font-bold leading-none tracking-[-0.03em] tabular-nums text-ink">{value}</span>
      <span className="mt-1.5 block text-[0.78rem] text-slate">{label}</span>
    </span>
  );
}

function ProductCard({ href, logo, children }: { href: string; logo: ReactNode; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group flex flex-col gap-6 rounded-xl border border-fog bg-white p-6 shadow-card transition-colors hover:border-clay"
    >
      <span className="flex items-center justify-between">
        {logo}
        <span className="text-[0.8rem] text-slate transition-colors group-hover:text-ink">Åbn →</span>
      </span>
      <span className="grid grid-cols-3 gap-3">{children}</span>
    </Link>
  );
}

// Kun Henvisninger: Stemplet som et tilvalg, der kan slaas til.
function AddStempletCard() {
  return (
    <Link
      href="/app/stemplet/tilfoej"
      className="group flex flex-col justify-between gap-6 rounded-xl border border-dashed border-clay bg-white/50 p-6 transition-colors hover:border-ink hover:bg-white"
    >
      <span className="flex items-center justify-between">
        <span className="opacity-50 transition-opacity group-hover:opacity-100">
          <StempletLogo className="text-[1.35rem]" />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-clay text-[1.1rem] leading-none text-stone transition-colors group-hover:border-ink group-hover:text-ink">
          +
        </span>
      </span>
      <span>
        <span className="block text-[0.95rem] font-[500] text-ink">Tilføj stempelkort</span>
        <span className="mt-0.5 block text-[0.85rem] text-stone">Få de nye kunder til at komme igen.</span>
      </span>
    </Link>
  );
}

// Kun Stemplet: Henvisninger som et tilvalg, der kan slaas til.
function AddReferralsCard() {
  return (
    <Link
      href="/app/henvisninger/tilfoej"
      className="group flex flex-col justify-between gap-6 rounded-xl border border-dashed border-clay bg-white/50 p-6 transition-colors hover:border-ink hover:bg-white"
    >
      <span className="flex items-center justify-between">
        <span className="opacity-50 transition-opacity group-hover:opacity-100">
          <HenvisningerLogo className="h-[1.9rem]" />
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-clay text-[1.1rem] leading-none text-stone transition-colors group-hover:border-ink group-hover:text-ink">
          +
        </span>
      </span>
      <span>
        <span className="block text-[0.95rem] font-[500] text-ink">Tilføj Henvisninger</span>
        <span className="mt-0.5 block text-[0.85rem] text-stone">Få nye kunder via dine kunder.</span>
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const { business } = await requireBusiness();
  const [stats, pulse, stampActivity, referrals] = await Promise.all([
    getBusinessStats(business.id),
    getOverviewPulse(business.id),
    getRecentActivity(business.id, 6),
    business.referralsEnabled ? getReferralOverview(business.id) : Promise.resolve(null),
  ]);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const activity: Activity[] = [
    ...stampActivity.map((a) => ({
      id: a.id,
      at: a.createdAt,
      text: STAMP_LABEL[a.action] ?? a.action,
      product: "stemplet" as const,
      alert: a.action === "FLAGGED" || a.action === "PIN_FAIL",
    })),
    ...(referrals?.recent ?? []).slice(0, 6).map((r) => ({
      id: r.id,
      at: new Date(r.createdAt),
      text: referralText(r),
      product: "henvisninger" as const,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  return (
    <>
      <header className="mb-8 animate-step">
        <p className="text-label font-[400] uppercase tracking-[0.14em] text-slate">{dateLabel}</p>
        <h1 className="mt-2 text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] text-ink md:text-[2.4rem]">
          {greetingFor(now)}, {business.name}
        </h1>
        <p className="mt-1.5 max-w-xl font-[300] text-[0.95rem] leading-relaxed text-stone">
          {!business.stampsEnabled && referrals
            ? referralSummaryLine({
                totalCustomers: stats.totalCustomers,
                newThisMonth: referrals.doneThisMonth,
                waiting: referrals.open,
              })
            : summaryLine({
                totalCustomers: stats.totalCustomers,
                activeCustomers: stats.activeCustomers,
                visitorsToday: pulse.visitorsToday,
                returningToday: pulse.returningToday,
              })}
        </p>
      </header>

      <div className="mb-10 grid gap-4 md:grid-cols-2">
        {business.stampsEnabled ? (
          <ProductCard href="/app/stemplet" logo={<StempletLogo className="text-[1.35rem]" />}>
            <Stat value={formatDkNumber(stats.perDay.at(-1)?.count ?? 0)} label="stempler i dag" />
            <Stat value={formatDkNumber(stats.newPerDay.at(-1)?.count ?? 0)} label="nye kortholdere" />
            <Stat value={formatDkNumber(pulse.redemptionsToday)} label="indløst i dag" />
          </ProductCard>
        ) : null}
        {referrals ? (
          <ProductCard href="/app/henvisninger" logo={<HenvisningerLogo className="h-[1.9rem]" />}>
            <Stat value={formatDkNumber(referrals.open)} label="venter på besøg" />
            <Stat value={formatDkNumber(referrals.doneThisMonth)} label="nye kunder i måneden" />
            <Stat
              value={
                referrals.pendingAmountKr > 0
                  ? `${formatDkNumber(referrals.pendingAmountKr)} kr.`
                  : formatDkNumber(referrals.pendingRewards)
              }
              label="til gode"
            />
          </ProductCard>
        ) : null}
        {business.stampsEnabled ? null : <AddStempletCard />}
        {business.referralsEnabled ? null : <AddReferralsCard />}
      </div>

      <section>
        <SectionHeader title="Seneste aktivitet" />
        <Panel>
          {activity.length === 0 ? (
            <p className="py-1 text-[0.88rem] text-stone">
              {business.stampsEnabled
                ? "Ingen aktivitet endnu. Sæt QR-koden op ved kassen, så begynder dagen at tælle."
                : "Ingen aktivitet endnu. Del linket til din henvisningsside, så begynder det at tælle."}
            </p>
          ) : (
            <ol className="flex flex-col divide-y divide-fog">
              {activity.map((a) => (
                <li key={`${a.product}-${a.id}`} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="flex items-baseline gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "inline-block h-[7px] w-[7px] shrink-0 rounded-full",
                        a.alert ? "bg-rust" : a.product === "stemplet" ? "" : "bg-ink",
                      )}
                      // Stemplets produktfarve (fast, saa dashboardets stil ikke rammer den).
                      style={!a.alert && a.product === "stemplet" ? { backgroundColor: "#a6502e" } : undefined}
                    />
                    <span className={cn("text-[0.9rem]", a.alert ? "text-rust" : "text-ink")}>{a.text}</span>
                  </span>
                  <span className="shrink-0 text-[0.75rem] text-slate">{relativeDk(a.at)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </section>
    </>
  );
}
