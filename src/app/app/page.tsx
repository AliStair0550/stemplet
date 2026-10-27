import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity, getOverviewPulse } from "@/lib/stats";
import { getReferralOverview, type ReferralRow } from "@/lib/referral-desk";
import { greetingFor, referralSummaryLine, summaryLine } from "@/lib/overview-text";
import { StempletLogo, HenvisningerLogo } from "@/components/ProductLogo";
import { Panel, SectionHeader } from "@/components/dash";
import { WalletCardPreview } from "@/components/WalletCardPreview";
import { loadCardPreview } from "@/lib/card-preview";
import { APP_URL } from "@/lib/env";
import { AddToHomeButton } from "./AddToHomeButton";
import { cn, formatDkNumber, relativeDk } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Hjem: kundernes kort i centrum. Til venstre butikkens kort, som det ser ud i
// Wallet (design under Kortet); til hoejre de funktioner, der ligger paa kortet
// (Stemplet, Henvisninger og dem, der kommer), hver med dagens tal og regler, og
// "Tilfoej" for dem, butikken ikke har endnu. Nederst een aktivitetsliste paa
// tvaers, hvor prikken viser funktionen (Stemplet terrakotta, Henvisninger sort).

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




function Feature({
  logo,
  href,
  rulesHref,
  children,
}: {
  logo: ReactNode;
  href: string;
  rulesHref: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <Link href={href} className="min-w-0">
          {logo}
        </Link>
        <span className="flex items-center gap-2">
          <Link href={rulesHref} className="rounded-full border border-clay px-3.5 py-1.5 text-[0.82rem] font-[500] text-ink hover:border-ink">
            Regler
          </Link>
          <Link href={href} className="rounded-full bg-ink px-3.5 py-1.5 text-[0.82rem] font-[500] text-white hover:bg-black">
            Åbn
          </Link>
        </span>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

function AddFeature({ href, logo, title, text }: { href: string; logo: ReactNode; title: string; text: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-[18px] border border-dashed border-clay bg-white/60 p-5 transition-colors hover:border-ink hover:bg-white"
    >
      <span className="min-w-0">
        <span className="block opacity-50 transition-opacity group-hover:opacity-100">{logo}</span>
        <span className="mt-2 block text-[0.95rem] font-[600] text-ink">{title}</span>
        <span className="block text-[0.85rem] text-stone">{text}</span>
      </span>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-clay text-[1.2rem] leading-none text-stone transition-colors group-hover:border-ink group-hover:text-ink">
        +
      </span>
    </Link>
  );
}

export default async function HomePage() {
  const { business } = await requireBusiness();
  const [stats, pulse, stampActivity, referrals, preview] = await Promise.all([
    getBusinessStats(business.id),
    getOverviewPulse(business.id),
    getRecentActivity(business.id, 6),
    business.referralsEnabled ? getReferralOverview(business.id) : Promise.resolve(null),
    loadCardPreview(business),
  ]);
  // Kortets offentlige side: stempelkortet, eller henvisningssiden uden Stemplet.
  const shareHref = `/k/${business.slug}`;

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

      {/* Kortet i centrum: kortet til venstre, funktionerne paa kortet til hoejre. */}
      <section className="mb-12 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col items-center gap-4 lg:items-stretch">
          <p className="w-full max-w-[300px] text-[0.85rem] font-[600] text-stone">Dit kort</p>
          <WalletCardPreview os="27" {...preview} />
          <div className="flex w-full max-w-[300px] gap-2">
            <Link href="/app/kortet" className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-ink px-4 text-[0.88rem] font-[600] text-white hover:bg-black">
              Design kortet
            </Link>
            <a
              href={`${APP_URL}${shareHref}`}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-clay px-4 text-[0.88rem] font-[500] text-ink hover:border-ink"
            >
              Se kortet
            </a>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h2 className="text-[1.3rem] font-bold tracking-[-0.025em] text-ink">På dit kort</h2>
            <p className="mt-0.5 text-[0.88rem] text-stone">Funktionerne ligger på det samme kort hos kunden. Tilføj dem, du vil bruge.</p>
          </div>
          {business.stampsEnabled ? (
            <Feature href="/app/stemplet" rulesHref="/app/regler?f=stempler" logo={<StempletLogo className="text-[1.35rem]" />}>
              <Stat value={formatDkNumber(stats.perDay.at(-1)?.count ?? 0)} label="stempler i dag" />
              <Stat value={formatDkNumber(stats.newPerDay.at(-1)?.count ?? 0)} label="nye kortholdere" />
              <Stat value={formatDkNumber(pulse.redemptionsToday)} label="indløst i dag" />
            </Feature>
          ) : null}
          {referrals ? (
            <Feature
              href="/app/henvisninger"
              rulesHref="/app/regler?f=henvisninger"
              logo={<HenvisningerLogo lines className="h-[1.9rem]" />}
            >
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
            </Feature>
          ) : null}
          {business.stampsEnabled ? null : (
            <AddFeature
              href="/app/regler"
              logo={<StempletLogo className="text-[1.35rem]" />}
              title="Tilføj Stemplet"
              text="Stempler på kortet, så kunderne kommer igen."
            />
          )}
          {business.referralsEnabled ? null : (
            <AddFeature
              href="/app/regler"
              logo={<HenvisningerLogo lines className="h-[1.9rem]" />}
              title="Tilføj Henvisninger"
              text="En henvisningskode på kortet, så kunderne skaffer nye kunder."
            />
          )}
          <p className="px-1 pt-1 text-[0.8rem] text-slate">Flere funktioner er på vej. De lægges på det samme kort.</p>
        </div>
      </section>

      {/* Dashboardet som app paa hjemmeskaermen (skjules, naar det allerede er). */}
      <div className="mb-12">
        <AddToHomeButton
          title="Tilføj Alius til hjemmeskærmen"
          text="Så åbner du dit dashboard med ét tryk, som en app."
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/app-icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px]" />
          }
        />
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
