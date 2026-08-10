import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { LoyaltyPanel } from "@/components/LoyaltyPanel";
import { ButtonLink } from "@/components/ui";
import { formatDkNumber, relativeDk } from "@/lib/utils";
import { AddToHomeHint } from "./AddToHomeHint";

// Smaa line-art ikoner til noegletal-fliserne.
const ICON = "h-[1.15rem] w-[1.15rem]";
function IconUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" />
    </svg>
  );
}
function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}
function IconStamp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
      <circle cx="12" cy="9" r="5" />
      <path d="M9.5 9l1.7 1.7L15 7" />
      <path d="M5 20h14" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={ICON}>
      <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
      <path d="M12 11v9M3 8h18v3H3zM12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8" />
    </svg>
  );
}
function IconQr() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[1.3rem] w-[1.3rem]">
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h3v3M20 14v.01M17 20h3v-3M14 20h.01" />
    </svg>
  );
}
function IconShare() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[1.3rem] w-[1.3rem]">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8 15.8 6.4M8.2 13.2l7.6 4.4" />
    </svg>
  );
}

const CTA =
  "inline-flex items-center gap-1.5 text-[0.74rem] font-[400] uppercase tracking-[0.08em] text-terracotta transition-opacity hover:opacity-70";

function CtaArrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Foerste-gangs-guide: gOr det tydeligt at der er TO veje i gang (fysisk QR i
// butikken + deling online) og forklarer helt konkret hvordan man stempler og
// giver personalet adgang. Vises indtil det foerste stempel er givet.
function GettingStarted({ slug }: { slug: string }) {
  const stampSteps = [
    "Kunden viser sit stempelkort fra sin Wallet.",
    "Åbn Stempel og scan QR-koden på kortet.",
    "Stemplet lander på kundens kort med det samme.",
  ];
  const label =
    "text-[0.68rem] font-[500] uppercase tracking-[0.16em] text-terracotta";
  const iconWrap =
    "flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 text-terracotta";
  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-terracotta/30 bg-white shadow-card">
      <div className="border-b border-fog bg-terracotta/[0.05] px-6 py-5 md:px-8">
        <h2 className="font-[400] text-[1.2rem] text-ink">Kom godt i gang</h2>
        <p className="mt-1.5 max-w-xl font-[300] text-[0.9rem] leading-relaxed text-stone">
          Der er to måder at få kunderne i gang. Brug den ene eller begge, det
          tager få minutter.
        </p>
      </div>

      {/* Foerst: tjek at kortet ser rigtigt ud, foer det printes/deles */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-fog bg-parchment/50 px-6 py-4 md:px-8">
        <span className="font-[300] text-[0.86rem] leading-relaxed text-stone">
          <span className="font-[500] text-ink">Først:</span> tjek at dit kort
          ser rigtigt ud, navn, farver, belønning og antal stempler.
        </span>
        <Link href="/app/kort" className={CTA}>
          Se og ret dit kort
          <CtaArrow />
        </Link>
      </div>

      {/* De to veje: fysisk QR i butikken, eller deling online */}
      <div className="grid gap-px bg-fog sm:grid-cols-2">
        <div className="flex flex-col gap-3 bg-white p-6 md:p-7">
          <div className="flex items-center gap-3">
            <span className={iconWrap}>
              <IconQr />
            </span>
            <span className={label}>Vej 1 · I butikken</span>
          </div>
          <span className="font-[400] text-[1.05rem] text-ink">
            Sæt din QR op ved kassen
          </span>
          <span className="font-[300] text-[0.85rem] leading-relaxed text-stone">
            Print plakaten med din QR-kode og hæng den op. Kunderne scanner den
            og henter stempelkortet direkte i deres Wallet.
          </span>
          <div className="mt-auto pt-2">
            <ButtonLink href="/app/materialer" variant="outline" size="md">
              Hent QR og skilte til print
            </ButtonLink>
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-white p-6 md:p-7">
          <div className="flex items-center gap-3">
            <span className={iconWrap}>
              <IconShare />
            </span>
            <span className={label}>Vej 2 · Online</span>
          </div>
          <span className="font-[400] text-[1.05rem] text-ink">
            Del kortet på sociale medier
          </span>
          <span className="font-[300] text-[0.85rem] leading-relaxed text-stone">
            Læg kortet på Instagram eller Facebook. Kunderne henter det
            hjemmefra og har det klar ved næste besøg.
          </span>
          <div className="mt-auto pt-2">
            <ButtonLink href="/app/kampagner" variant="outline" size="md">
              Del kortet
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Sådan giver du et stempel + selvtest + adgang til personalet */}
      <div className="border-t border-fog px-6 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <IconStamp />
          </span>
          <span className="font-[400] text-[1rem] text-ink">
            Sådan giver du et stempel
          </span>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {stampSteps.map((t, i) => (
            <li
              key={t}
              className="flex gap-2.5 text-[0.85rem] font-[300] leading-relaxed text-stone"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 font-fraunces text-[0.8rem] italic text-terracotta">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-md border border-terracotta/20 bg-terracotta/[0.04] px-4 py-3">
          <p className="font-[300] text-[0.84rem] leading-relaxed text-stone">
            <span className="font-[500] text-ink">Prøv det selv:</span> hent
            kortet på din egen telefon og giv dig selv det første stempel, så
            ved du præcis, hvad kunden oplever.{" "}
            <Link
              href={`/k/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-terracotta underline underline-offset-2 hover:opacity-70"
            >
              Se kundens side
            </Link>
          </p>
        </div>

        <div className="mt-5">
          <ButtonLink href="/app/kasse" variant="primary" size="md">
            Åbn Stempel
          </ButtonLink>
        </div>

        <p className="mt-4 font-[300] text-[0.84rem] leading-relaxed text-stone">
          Skal personalet også kunne stemple?{" "}
          <Link
            href="/app/indstillinger#kasse-enheder"
            className="text-terracotta underline underline-offset-2 hover:opacity-70"
          >
            Par en kasse-enhed
          </Link>{" "}
          så de får adgang uden dit login. Personale-PIN&apos;en bruges kun, når
          en kunde indløser en fuld belønning, ikke til at give stempler.
        </p>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

export default async function OverviewPage() {
  const { business } = await requireBusiness();
  const [stats, activity] = await Promise.all([
    getBusinessStats(business.id),
    getRecentActivity(business.id, 6),
  ]);

  const dateLabel = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  const statusLine =
    stats.totalCustomers === 0
      ? "Du er klar til at tage imod din første kunde. Følg trinene nedenfor, så er du i gang."
      : stats.stampsToday > 0
        ? `${formatDkNumber(stats.stampsToday)} ${stats.stampsToday === 1 ? "stempel" : "stempler"} i dag. Du har ${formatDkNumber(stats.totalCustomers)} kortholdere ude.`
        : `Du har ${formatDkNumber(stats.totalCustomers)} kortholdere ude. Scan kundens kort ved kassen, så begynder dagen at tælle.`;

  return (
    <>
      {/* Velkomst-band: butikkens brand-glimt, dato og status i et roligt panel */}
      <div className="relative mb-6 overflow-hidden rounded-lg border border-fog bg-white shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-[90px]"
          style={{ background: business.primaryColor, opacity: 0.12 }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5 p-6 md:p-8">
          <div className="min-w-0">
            <p className="text-label font-[400] uppercase tracking-[0.14em] text-terracotta">
              {dateLabel}
            </p>
            <h1 className="mt-2 font-[300] text-[1.9rem] leading-tight tracking-[0.01em] text-ink">
              Hej, {business.name}
            </h1>
            <p className="mt-1.5 max-w-md font-[300] text-[0.9rem] leading-relaxed text-stone">
              {statusLine}
            </p>
          </div>
          {stats.stampsTotal > 0 ? (
            <ButtonLink href="/app/kasse" variant="primary" size="md">
              Stempel
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {stats.stampsTotal === 0 ? (
        <GettingStarted slug={business.slug} />
      ) : (
        <>
          <AddToHomeHint />

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Kortholdere i alt"
          icon={<IconUsers />}
          value={<AnimatedNumber value={stats.totalCustomers} />}
          sub={`${formatDkNumber(stats.activeCustomers)} aktive seneste 60 dage`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          icon={<IconSpark />}
          value={<AnimatedNumber value={stats.newCustomers30} />}
          sub={`${formatDkNumber(stats.newCustomers7)} seneste 7 dage`}
        />
        <StatTile
          label="Stempler i dag"
          icon={<IconStamp />}
          value={<AnimatedNumber value={stats.stampsToday} />}
          sub={`${formatDkNumber(stats.stampsWeek)} seneste 7 dage`}
        />
        <StatTile
          label="Indløsninger"
          icon={<IconGift />}
          value={<AnimatedNumber value={stats.redemptionsTotal} />}
          sub={`${formatDkNumber(stats.redemptions30)} seneste 30 dage`}
        />
      </div>

      {stats.stampsTotal > 0 ? (
        <div className="mt-6">
          <LoyaltyPanel loyalty={stats.loyalty} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Panel>
            <h2 className="mb-4 text-label font-[400] uppercase tracking-[0.14em] text-slate">
              Stempler seneste 7 dage
            </h2>
            <BarChart
              data={stats.perDay.slice(-7).map((d) => ({
                label: d.label,
                count: d.count,
                sublabel: d.weekday,
              }))}
            />
          </Panel>

          <Panel>
            <h2 className="mb-4 text-label font-[400] uppercase tracking-[0.14em] text-slate">
              Nye kunder seneste 7 dage
            </h2>
            <BarChart
              data={stats.newPerDay.slice(-7).map((d) => ({
                label: d.label,
                count: d.count,
                sublabel: d.weekday,
              }))}
            />
          </Panel>
        </div>

        <Panel>
          <h2 className="mb-4 text-label font-[400] uppercase tracking-[0.14em] text-slate">
            Seneste aktivitet
          </h2>
          {activity.length === 0 ? (
            <p className="font-[300] text-[0.85rem] text-slate">
              Ingen aktivitet endnu. Sæt dit skilt op ved kassen.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((a) => {
                const isAlert = a.action === "FLAGGED" || a.action === "PIN_FAIL";
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 border-b border-fog pb-2 last:border-0"
                  >
                    <span
                      className={`flex items-center gap-2 text-[0.82rem] font-[300] ${
                        isAlert ? "text-rust" : "text-ink"
                      }`}
                    >
                      {isAlert ? (
                        <span
                          aria-hidden
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-rust"
                        />
                      ) : null}
                      {ACTION_LABEL[a.action] ?? a.action}
                    </span>
                    <span className="shrink-0 text-[0.72rem] font-[300] text-slate">
                      {relativeDk(a.createdAt)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
        </>
      )}
    </>
  );
}
