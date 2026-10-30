import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getOverviewPulse } from "@/lib/stats";
import { getReadyCustomers } from "@/lib/ready-customers";
import { getReferralOverview } from "@/lib/referral-desk";
import { greetingFor, referralSummaryLine, summaryLine } from "@/lib/overview-text";
import { Panel, SectionHeader } from "@/components/dash";
import { WalletCardPreview } from "@/components/WalletCardPreview";
import { loadCardPreview } from "@/lib/card-preview";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { WalletIcon } from "@/components/ui";
import { AddToHomeButton } from "./AddToHomeButton";
import { formatDkNumber } from "@/lib/utils";
import { DEFAULT_PRIMARY } from "@/lib/brand";
import { FirstCustomerCelebration } from "./FirstCustomerCelebration";
import { cookies } from "next/headers";
import { ONBOARDING_HIDDEN_COOKIE } from "@/lib/cookies";
import { dismissOnboardingAction } from "./actions";

export const metadata = { title: { absolute: "Hjem - Folka Kort" } };

export const dynamic = "force-dynamic";

// Hjem: kundernes kort i centrum. Til venstre butikkens kort, som det ser ud i
// Wallet (design under Kortet); til hoejre de funktioner, der ligger paa kortet
// (Stemplet, Henvisninger og dem, der kommer), hver med dagens tal og regler, og
// "Tilfoej" for dem, butikken ikke har endnu. "Klar til belønning" viser kunder,
// der venter paa noget ved kassen, med et tryk til at tjekke dem ind.

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
          <Link href={href} className="rounded-full bg-ink px-3.5 py-1.5 text-[0.82rem] font-[500] text-white hover:bg-[#0A2D5A]">
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
  const [stats, pulse, ready, referrals, preview] = await Promise.all([
    getBusinessStats(business.id),
    getOverviewPulse(business.id),
    getReadyCustomers(business),
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

  // Kom i gang: flueben fra det, vi allerede ved. Plakaten kan vi ikke se.
  const designed = business.primaryColor !== DEFAULT_PRIMARY || !!business.logoUrl || !!business.cardArtwork;
  const steps = [
    { title: "Design kortet", text: "Navn, farver og billede.", href: "/app/kortet", cta: "Design kortet", done: designed },
    { title: "Hæng QR-koden op", text: "Plakat eller bordskilt ved kassen.", href: "/app/plakat", cta: "Lav plakaten", done: false },
    { title: "Prøv det selv", text: business.stampsEnabled
        ? "Hent kortet på din telefon. Find dig selv under Kunder, og giv et stempel."
        : "Hent kortet på din telefon, og se det, dine kunder ser.", href: `${APP_URL}${shareHref}`, cta: "Åbn dit kort", external: true, done: false },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const onboardingHidden = ((await cookies()).get(ONBOARDING_HIDDEN_COOKIE)?.value ?? "").split(".").includes(business.id);

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

      {/* Ny butik (ingen kortholdere endnu): de tre skridt til det foerste kort. */}
      {stats.totalCustomers === 0 && !onboardingHidden ? (
        <section aria-labelledby="kom-i-gang" className="mb-10 rounded-[22px] bg-[#061C3D] p-6 text-white md:p-7">
          <div className="flex items-center justify-between gap-4">
            <h2 id="kom-i-gang" className="text-[1.25rem] font-semibold tracking-[-0.02em]">Din første kunde i dag</h2>
            <span className="flex items-center gap-2">
              <span className="text-[0.9rem] font-semibold tabular-nums text-[#7CC4FF]">{doneCount}/3</span>
              <form action={dismissOnboardingAction}>
                <button
                  type="submit"
                  aria-label="Luk"
                  className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </form>
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <div className="h-full rounded-full bg-[#7CC4FF] transition-[width] duration-700" style={{ width: `${Math.max(4, (doneCount / 3) * 100)}%` }} />
          </div>
          <ol className="mt-5 grid gap-3 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className={`flex flex-col rounded-[16px] p-4 ring-1 ring-inset ${s.done ? "bg-white/[.03] ring-white/5" : "bg-white/[.07] ring-white/10"}`}>
                <span className="flex items-center gap-2 text-[0.8rem] font-semibold text-[#7CC4FF]">
                  {s.done ? (
                    <span aria-label="Klaret" className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#7CC4FF] text-[#061C3D]">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  ) : null}
                  Trin {i + 1}
                </span>
                <span className="mt-1 text-[1rem] font-semibold">{s.title}</span>
                <span className="mt-1 text-[0.85rem] leading-snug text-white/70">{s.text}</span>
                {s.external ? (
                  <a href={s.href} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 w-fit items-center rounded-full bg-white px-4 text-[0.85rem] font-semibold text-[#061C3D] hover:bg-[#E8F0FB]">
                    {s.cta}
                  </a>
                ) : (
                  <Link href={s.href} className="mt-4 inline-flex min-h-10 w-fit items-center rounded-full bg-white px-4 text-[0.85rem] font-semibold text-[#061C3D] hover:bg-[#E8F0FB]">
                    {s.cta}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : stats.totalCustomers <= 3 ? (
        <FirstCustomerCelebration businessId={business.id} customers={stats.totalCustomers} />
      ) : null}

      {/* Klar til belønning: kunder, der venter paa noget ved kassen. Et tryk
          aabner kunden i kassen (samme kundekort som ved scan). */}
      {ready.customers.length > 0 ? (
        <section className="mb-12">
          <SectionHeader title="Klar til belønning" />
          <Panel>
            <ul className="flex flex-col divide-y divide-fog">
              {ready.customers.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/app/kasse?kort=${encodeURIComponent(c.serial)}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] font-[600] text-ink">{c.name ?? "Kortholder"}</span>
                      <span className="block truncate text-[0.8rem] text-stone">
                        {c.reasons
                          .map((r) => (r === "stamps" ? "Fuldt stempelkort" : r === "reward" ? "Belønning fra henvisning" : "Første besøg via en ven"))
                          .join(" · ")}
                      </span>
                    </span>
                    <span className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-ink px-4 text-[0.85rem] font-semibold text-white">
                      Tjek ind
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ) : null}

      {/* Kortet i centrum: kortet til venstre, funktionerne paa kortet til hoejre. */}
      <section className="mb-12 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-10">
        <div className="flex flex-col items-center gap-4 lg:items-stretch">
          <p className="w-full max-w-[300px] text-[0.85rem] font-[600] text-stone">Dit kort</p>
          {/* Genvej til QR-koden, der kan vises til kunden direkte fra telefonen. */}
          <Link
            href="/app/regler?f=kundekort&vis=1"
            className="flex min-h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-full bg-ink px-4 text-[0.92rem] font-[600] text-white hover:bg-[#0A2D5A]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18v2M18 14h2" />
            </svg>
            Vis QR-kode
          </Link>
          {WALLET_ENABLED ? (
            // Butikkens eget QR-kort i ejerens Wallet: hurtigst at vise kunderne.
            <a
              href="/api/wallet/butikkort"
              className="-mt-1 flex min-h-11 w-full max-w-[300px] items-center justify-center gap-2 rounded-full bg-black px-4 text-[0.88rem] font-[600] text-white"
            >
              <WalletIcon />
              Læg QR-koden i din Wallet
            </a>
          ) : null}
          {/* Knapperne under kortet i Wallet vises under Design, ikke her. */}
          <WalletCardPreview os="27" {...preview} actions={[]} />
          <p className="-mt-1 w-full max-w-[300px] text-center text-[0.75rem] text-slate">Eksempel på en kundes kort</p>
          <div className="flex w-full max-w-[300px] gap-2">
            <Link href="/app/kortet" className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-clay px-4 text-[0.88rem] font-[500] text-ink hover:border-ink">
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
          </div>
          {business.stampsEnabled ? (
            <Feature href="/app/stemplet" rulesHref="/app/regler?f=stempler" logo={<span className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Stempler</span>}>
              {stats.totalCustomers === 0 ? (
                <p className="col-span-3 text-[0.95rem] font-[500] text-stone">Første stempel venter.</p>
              ) : (
                <>
                  <Stat value={formatDkNumber(stats.perDay.at(-1)?.count ?? 0)} label="stempler i dag" />
                  <Stat value={formatDkNumber(stats.newPerDay.at(-1)?.count ?? 0)} label="nye i dag" />
                  <Stat value={formatDkNumber(pulse.redemptionsToday)} label="indløst i dag" />
                </>
              )}
            </Feature>
          ) : null}
          {referrals ? (
            <Feature
              href="/app/henvisninger"
              rulesHref="/app/regler?f=henvisninger"
              logo={<span className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Henvisninger</span>}
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
              href="/app/stemplet/tilfoej"
              logo={<span className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Stempler</span>}
              title="Tilføj stempler"
              text="Stempler på kortet, så kunderne kommer igen."
            />
          )}
          {business.referralsEnabled ? null : (
            <AddFeature
              href="/app/henvisninger/tilfoej"
              logo={<span className="text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">Henvisninger</span>}
              title="Tilføj henvisninger"
              text="En henvisningskode på kortet, så kunderne skaffer nye kunder."
            />
          )}
        </div>
      </section>

      {/* Dashboardet som app paa hjemmeskaermen (skjules, naar det allerede er). */}
      <div className="mb-12">
        <AddToHomeButton
          title="Tilføj Folka til hjemmeskærmen"
          text="Så åbner du dit dashboard med ét tryk, som en app."
          icon={
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/app-icon-192.png" alt="" className="h-10 w-10 shrink-0 rounded-[10px]" />
          }
        />
      </div>

      {/* Ingen venter: en kort note nederst (listen staar oeverst, naar der er nogen). */}
      {ready.customers.length === 0 && stats.totalCustomers > 0 ? (
        <section>
          <SectionHeader title="Klar til belønning" />
          <Panel>
            <p className="py-1 text-[0.88rem] text-stone">Ingen venter lige nu.</p>
          </Panel>
        </section>
      ) : null}
    </>
  );
}
