import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getOverviewPulse } from "@/lib/stats";
import { getReadyCustomers } from "@/lib/ready-customers";
import { getReferralOverview } from "@/lib/referral-desk";
import { getRewardHistory } from "@/lib/reward-history";
import { cardShareText, greetingFor, referralSummaryLine, summaryLine, yesterdayLine } from "@/lib/overview-text";
import { Panel, SectionHeader } from "@/components/dash";
import { WalletCardPreview } from "@/components/WalletCardPreview";
import { loadCardPreview } from "@/lib/card-preview";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { WalletIcon } from "@/components/ui";
import { AddToHomeButton } from "./AddToHomeButton";
import { formatDkNumber, relativeDk } from "@/lib/utils";
import { DEFAULT_PRIMARY } from "@/lib/brand";
import { FirstCustomerCelebration } from "./FirstCustomerCelebration";
import { cookies } from "next/headers";
import { ONBOARDING_HIDDEN_COOKIE, ONBOARDING_SEEN_COOKIE } from "@/lib/cookies";
import { dismissOnboardingAction } from "./actions";
import { ShareCardButton } from "./ShareCardButton";
import { SeeCardLink } from "./SeeCardLink";

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
  const [stats, pulse, ready, referrals, preview, history] = await Promise.all([
    getBusinessStats(business.id),
    getOverviewPulse(business.id),
    getReadyCustomers(business),
    business.referralsEnabled ? getReferralOverview(business.id) : Promise.resolve(null),
    loadCardPreview(business),
    getRewardHistory(business),
  ]);
  // Kortets offentlige side: stempelkortet, eller henvisningssiden uden Stemplet.
  const shareHref = `/k/${business.slug}`;

  const now = new Date();
  // I gaar (dansk tid): stempler og nye kunder fra dagstallene, beloenninger fra
  // "Givet for nylig". Vises, saa ejeren dagen efter kan se, hvad der skete.
  const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" });
  const yesterdayKey = stats.perDay.at(-2)?.date ?? null;
  const yesterday = yesterdayKey
    ? yesterdayLine({
        stamps: stats.perDay.at(-2)?.count ?? 0,
        newCustomers: stats.newPerDay.at(-2)?.count ?? 0,
        rewards: history.filter((h) => dayKey.format(h.at) === yesterdayKey).length,
      })
    : null;
  const dateLabel = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);

  const shareUrl = `${APP_URL}${shareHref}`;
  const shareText = cardShareText({
    stampsEnabled: business.stampsEnabled,
    stampsRequired: preview.stampsRequired,
    rewardText: business.stampsEnabled ? preview.rewardText : "",
    friendReward: referrals ? preview.friendReward : null,
    referrerReward: referrals ? preview.referrerReward : null,
  });

  // Kom i gang: se kortet paa telefonen, goer det til dit og del det. Plakaten
  // ligger i Menu; de foerste kunder faar kortet vist paa ejerens telefon eller
  // delt online. Delt = link delt/kopieret, QR-koden vist eller plakaten hentet.
  const jar = await cookies();
  const inCookie = (name: string) => (jar.get(name)?.value ?? "").split(".").includes(business.id);
  const designed = business.primaryColor !== DEFAULT_PRIMARY || !!preview.logoUrl || !!preview.artwork || business.cardStyle === "photo";
  const shared = !!business.sharedAt || !!business.posterMadeAt;
  const seen = inCookie(ONBOARDING_SEEN_COOKIE) || shared;
  const steps = [
    { kind: "see", title: "Se kortet på din telefon", text: "Hent det selv, så ser du det som dine kunder.", href: shareUrl, cta: "Se kortet", done: seen },
    { kind: "design", title: "Gør det til dit", text: "Logo, farver og billede.", href: "/app/kortet", cta: "Design kortet", done: designed },
    { kind: "share", title: "Del med dine første kunder", text: WALLET_ENABLED ? "Vis QR-koden fra din Wallet ved kassen, eller send linket." : "Send linket, eller vis QR-koden ved kassen.", href: shareUrl, cta: "Del kortet", done: shared },
  ] as const;
  const doneCount = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);
  const onboardingHidden = inCookie(ONBOARDING_HIDDEN_COOKIE);
  const guideOpen = stats.totalCustomers === 0 && !onboardingHidden;

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
        {yesterday ? <p className="mt-1 max-w-xl text-[0.9rem] text-stone">{yesterday}</p> : null}
      </header>

      {/* Ny butik (ingen kortholdere endnu): de tre skridt til det foerste kort. */}
      {guideOpen ? (
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
          <p className="mt-3 text-[0.9rem] text-white/70">
            {nextStep ? "Tre trin, så er du i gang." : "Du er klar. Nu mangler bare den første kunde."}
          </p>
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
                {s.kind === "share" ? (
                  <>
                    {/* Hurtigst ved kassen: QR-koden i din egen Wallet, klar til at vise. */}
                    {WALLET_ENABLED ? (
                      <a
                        href="/api/wallet/butikkort"
                        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-black px-4 text-[0.88rem] font-semibold text-white ring-1 ring-inset ring-white/25"
                      >
                        <WalletIcon />
                        Føj til Apple Wallet
                      </a>
                    ) : null}
                    <span className={`${WALLET_ENABLED ? "mt-2" : "mt-4"} flex flex-wrap gap-2`}>
                      <ShareCardButton businessName={business.name} url={shareUrl} text={shareText} shared={!!business.sharedAt} tone="light" />
                      <Link
                        href="/app/regler?f=kundekort&vis=1"
                        className="inline-flex min-h-10 items-center rounded-full px-4 text-[0.85rem] font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10"
                      >
                        Vis QR-kode
                      </Link>
                    </span>
                  </>
                ) : s.kind === "see" ? (
                  <SeeCardLink
                    href={s.href}
                    seen={s.done}
                    className="mt-4 inline-flex min-h-10 w-fit items-center rounded-full bg-white px-4 text-[0.85rem] font-semibold text-[#061C3D] hover:bg-[#E8F0FB]"
                  >
                    {s.cta}
                  </SeeCardLink>
                ) : (
                  <Link href={s.href} className="mt-4 inline-flex min-h-10 w-fit items-center rounded-full bg-white px-4 text-[0.85rem] font-semibold text-[#061C3D] hover:bg-[#E8F0FB]">
                    {s.cta}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : stats.totalCustomers === 0 && nextStep ? (
        <section className="mb-10 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-fog bg-white p-4 shadow-card md:p-5">
          <span className="min-w-0">
            <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-slate">Næste skridt</span>
            <span className="mt-0.5 block text-[1rem] font-semibold text-ink">{nextStep.title}</span>
          </span>
          {nextStep.kind === "share" ? (
            <ShareCardButton businessName={business.name} url={shareUrl} text={shareText} shared={!!business.sharedAt} />
          ) : nextStep.kind === "see" ? (
            <SeeCardLink
              href={nextStep.href}
              seen={false}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-[0.88rem] font-semibold text-white hover:bg-[#0A2D5A]"
            >
              {nextStep.cta}
            </SeeCardLink>
          ) : (
            <Link href={nextStep.href} className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-[0.88rem] font-semibold text-white hover:bg-[#0A2D5A]">
              {nextStep.cta}
            </Link>
          )}
        </section>
      ) : stats.totalCustomers <= 3 ? (
        <FirstCustomerCelebration
          businessId={business.id}
          customers={stats.totalCustomers}
          action={<ShareCardButton businessName={business.name} url={shareUrl} text={shareText} shared={!!business.sharedAt} tone="light" />}
        />
      ) : null}

      {/* Klar til belønning: kunder, der venter paa noget ved kassen. Et tryk
          aabner kunden i kassen (samme kundekort som ved scan). */}
      {ready.customers.length > 0 ? (
        <section className="mb-12">
          <SectionHeader title="Klar til belønning" />
          <Panel>
            <ul className="flex flex-col divide-y divide-fog">
              {ready.customers.map((c) => (
                <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                  <Link
                    href={`/app/kasse?kort=${encodeURIComponent(c.serial)}`}
                    className="flex items-center justify-between gap-4"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] font-[600] text-ink">{c.name ?? "Kortholder"}</span>
                      <span className="mt-0.5 block text-[0.8rem] leading-snug text-stone">
                        {c.reasons
                          .map((r) => (r === "stamps" ? "Fuldt stempelkort" : r === "reward" ? "Belønning fra henvisning" : "Første besøg via en ven"))
                          .join(" · ")}
                      </span>
                    </span>
                    {/* Knappen siger, hvad man skal goere (ikke "Tjek ind"). */}
                    <span className="inline-flex min-h-10 shrink-0 items-center rounded-full bg-ink px-4 text-[0.85rem] font-semibold text-white">
                      {c.reasons.includes("stamps") || c.reasons.includes("reward") ? "Giv belønning" : "Giv velkomstrabat"}
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
          {/* Del kortet: QR-koden til kunden foran dig, linket til alle andre.
              Mens Kom i gang er aaben, staar knapperne kun dér (ikke to gange). */}
          {guideOpen ? null : (
          <>
          <div className="grid w-full max-w-[300px] grid-cols-2 gap-2">
          <Link
            href="/app/regler?f=kundekort&vis=1"
            className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-ink px-4 text-[0.92rem] font-[600] text-white hover:bg-[#0A2D5A]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
              <rect x="4" y="4" width="6" height="6" rx="1" />
              <rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" />
              <path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18v2M18 14h2" />
            </svg>
            Vis QR-kode
          </Link>
          <ShareCardButton businessName={business.name} url={shareUrl} text={shareText} shared={!!business.sharedAt} className="min-h-12 px-4 text-[0.92rem]" />
          </div>
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
          </>
          )}
          {/* Knapperne under kortet i Wallet vises under Design, ikke her. */}
          {/* Hele kortet kan trykkes og aabner Design (ikke et eksempel, man trykker forgaeves paa). */}
          <Link href="/app/kortet" aria-label="Design kortet" className="block w-full max-w-[300px] transition-transform active:scale-[0.98]">
            <WalletCardPreview os="27" {...preview} actions={[]} hideQr />
          </Link>
          <p className="-mt-1 w-full max-w-[300px] text-center text-[0.75rem] text-slate">Tryk på kortet for at designe det</p>
          {guideOpen ? null : (
          <div className="flex w-full max-w-[300px] gap-2">
            <Link href="/app/kortet" className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-clay px-4 text-[0.88rem] font-[500] text-ink hover:border-ink">
              Design kortet
            </Link>
            <a
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-clay px-4 text-[0.88rem] font-[500] text-ink hover:border-ink"
            >
              Se kortet
            </a>
          </div>
          )}
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
              <Stat value={formatDkNumber(referrals.doneThisMonth)} label={referrals.doneThisMonth === 1 ? "ny kunde i måneden" : "nye kunder i måneden"} />
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
        <section className="mb-12">
          <SectionHeader title="Klar til belønning" />
          <Panel>
            <p className="py-1 text-[0.88rem] text-stone">Ingen venter lige nu.</p>
          </Panel>
        </section>
      ) : null}

      {/* Belønningshistorik: hvad er givet ved kassen for nylig. */}
      {history.length > 0 ? (
        <section>
          <SectionHeader title="Givet for nylig" />
          <Panel>
            <ul className="flex flex-col divide-y divide-fog">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-[0.95rem] font-[600] text-ink">{h.name ?? "Kortholder"}</span>
                    <span className="block text-[0.8rem] leading-snug text-stone">
                      {h.kind === "stamps" ? "Fuldt stempelkort" : h.kind === "visit" ? "Første besøg via en ven" : "Belønning fra henvisning"}
                      {" · "}
                      {h.what}
                    </span>
                  </span>
                  <span className="shrink-0 text-[0.78rem] text-slate">{relativeDk(h.at)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </section>
      ) : null}
    </>
  );
}
