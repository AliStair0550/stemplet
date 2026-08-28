import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import {
  getBusinessStats,
  getRecentActivity,
  getOverviewPulse,
} from "@/lib/stats";
import { Panel, SectionHeader } from "@/components/dash";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ButtonLink, btnClass } from "@/components/ui";
import { cn, formatDkNumber, relativeDk } from "@/lib/utils";
import { AddToHomeHint } from "./AddToHomeHint";
import { AddEmployeeButton } from "./AddEmployeeButton";
import { CtaArrow, IconGift, IconSpark, IconStamp, IconUsers } from "./icons";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

// Hilsen efter tid paa dagen (dansk tid). en-GB giver 00-23 uden lokale-quirks.
function greetingFor(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Copenhagen",
      hour: "2-digit",
      hour12: false,
    }).format(now),
  );
  if (hour < 10) return "Godmorgen";
  if (hour < 12) return "God formiddag";
  if (hour < 18) return "God eftermiddag";
  return "Godaften";
}

// Én sætning i almindeligt dansk: hvordan går dagen? Bygget af dagens tal, saa
// ejeren forstaar situationen paa faa sekunder uden at laese noegletal.
function summaryLine(p: {
  totalCustomers: number;
  activeCustomers: number;
  visitorsToday: number;
  returningToday: number;
}): string {
  if (p.totalCustomers === 0) {
    return "Velkommen. I er klar til at tage imod jeres første kunde.";
  }
  if (p.visitorsToday === 0) {
    const base = p.activeCustomers > 0 ? p.activeCustomers : p.totalCustomers;
    return `Ingen stempler endnu i dag. I har ${formatDkNumber(base)} ${
      base === 1 ? "aktiv kortholder" : "aktive kortholdere"
    }, klar til et genbesøg.`;
  }
  if (p.returningToday === 0) {
    return `${formatDkNumber(p.visitorsToday)} ${
      p.visitorsToday === 1 ? "ny kunde har" : "nye kunder har"
    } besøgt jer i dag.`;
  }
  return `${formatDkNumber(p.visitorsToday)} ${
    p.visitorsToday === 1 ? "kunde har" : "kunder har"
  } besøgt jer i dag, ${formatDkNumber(p.returningToday)} af dem er kommet igen.`;
}

// Sammenligning med i gaar, skrevet ud, saa ejeren slipper for at regne.
function deltaLabel(
  today: number,
  yesterday: number,
): { text: string; dir: "up" | "down" | "flat" } {
  const d = today - yesterday;
  if (d > 0) return { text: `${d} flere end i går`, dir: "up" };
  if (d < 0) return { text: `${Math.abs(d)} færre end i går`, dir: "down" };
  return { text: "som i går", dir: "flat" };
}

// Ét noegletal med dagens tal, sammenligning til i gaar og en kort forklaring.
function PulseTile({
  label,
  value,
  yesterday,
  sub,
  icon,
}: {
  label: string;
  value: number;
  yesterday: number;
  sub: string;
  icon: ReactNode;
}) {
  const d = deltaLabel(value, yesterday);
  const showDelta = value !== 0 || yesterday !== 0;
  return (
    <div className="group relative overflow-hidden rounded-lg border border-fog bg-gradient-to-b from-white to-sand/40 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <span className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
          {label}
        </span>
        <span className="text-terracotta/60 transition-colors group-hover:text-terracotta">
          {icon}
        </span>
      </div>
      <div className="mt-3 font-[300] text-[2rem] leading-none text-ink tabular-nums">
        <AnimatedNumber value={value} />
      </div>
      {showDelta ? (
        <div className="mt-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-[400]",
              d.dir === "up"
                ? "bg-terracotta/10 text-terracotta"
                : "bg-fog/70 text-slate",
            )}
          >
            <span aria-hidden>
              {d.dir === "up" ? "↑" : d.dir === "down" ? "↓" : "•"}
            </span>
            {d.text}
          </span>
        </div>
      ) : null}
      <div className="mt-2 text-[0.72rem] font-[300] leading-relaxed text-stone">
        {sub}
      </div>
    </div>
  );
}

type Rec = {
  eyebrow: string;
  title: string;
  body: string;
  action:
    | { type: "link"; href: string; label: string }
    | { type: "employee"; label: string };
};

// Den ENE kontekstuelle anbefaling. Vaelger det mest presserende signal, saa
// ejeren altid ved, hvad naeste skridt er, uden at drukne i valg.
function pickRecommendation(
  stats: { stampsTotal: number; totalCustomers: number },
  pulse: { deviceCount: number; nearReward: number },
): Rec {
  if (stats.stampsTotal === 0) {
    return {
      eyebrow: "Kom i gang",
      title: "Få jeres første kunde på kortet",
      body: "Vis QR-koden ved kassen eller del den online, så en kunde kan hente kortet og få sit første stempel.",
      action: { type: "link", href: "/app/materialer", label: "Del dit kort" },
    };
  }
  if (pulse.deviceCount === 0) {
    return {
      eyebrow: "Anbefalet nu",
      title: "Lad personalet stemple",
      body: "Par en telefon eller iPad som fast kasse. Det tager under et minut, og enheden ser aldrig dine indstillinger.",
      action: { type: "employee", label: "Tilføj en medarbejder" },
    };
  }
  if (stats.totalCustomers >= 80 && stats.totalCustomers < 100) {
    return {
      eyebrow: "Godt gået",
      title: "I nærmer jer 100 kortholdere",
      body: `I har ${formatDkNumber(
        stats.totalCustomers,
      )} kortholdere. Den gratis plan rummer op til 100, så det er værd at kigge på abonnementet i god tid.`,
      action: {
        type: "link",
        href: "/app/indstillinger#abonnement",
        label: "Se abonnement",
      },
    };
  }
  if (pulse.nearReward >= 3) {
    return {
      eyebrow: "Anbefalet nu",
      title: `${formatDkNumber(pulse.nearReward)} kunder er tæt på en belønning`,
      body: "De mangler kun ét stempel. Et godt tidspunkt at minde om kortet, så de kommer forbi.",
      action: {
        type: "link",
        href: "/app/kampagner",
        label: "Del en påmindelse",
      },
    };
  }
  return {
    eyebrow: "Voks videre",
    title: "Få flere kortholdere",
    body: "Del dit kort på Instagram og Facebook, så kunderne kan hente det hjemmefra.",
    action: {
      type: "link",
      href: "/app/kampagner",
      label: "Del på sociale medier",
    },
  };
}

function RecommendationCard({ rec }: { rec: Rec }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-terracotta/30 bg-terracotta/[0.05] p-6 shadow-card md:p-8">
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-terracotta/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
            {rec.eyebrow}
          </p>
          <h3 className="mt-1.5 font-[400] text-[1.15rem] text-ink">
            {rec.title}
          </h3>
          <p className="mt-1 max-w-md font-[300] text-[0.88rem] leading-relaxed text-stone">
            {rec.body}
          </p>
        </div>
        <div className="shrink-0">
          {rec.action.type === "employee" ? (
            <AddEmployeeButton
              label={rec.action.label}
              className={`${btnClass("primary")} w-full justify-center md:w-auto`}
            />
          ) : (
            <ButtonLink
              href={rec.action.href}
              variant="primary"
              className="w-full justify-center md:w-auto"
            >
              {rec.action.label}
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function OverviewPage() {
  const { business } = await requireBusiness();
  const [stats, activity, pulse] = await Promise.all([
    getBusinessStats(business.id),
    getRecentActivity(business.id, 6),
    getOverviewPulse(business.id),
  ]);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(now);
  const greeting = greetingFor(now);
  const summary = summaryLine({
    totalCustomers: stats.totalCustomers,
    activeCustomers: stats.activeCustomers,
    visitorsToday: pulse.visitorsToday,
    returningToday: pulse.returningToday,
  });

  const isNew = stats.stampsTotal === 0;
  const rec = pickRecommendation(stats, pulse);

  const stampsToday = stats.perDay.at(-1)?.count ?? 0;
  const stampsYesterday = stats.perDay.at(-2)?.count ?? 0;
  const newToday = stats.newPerDay.at(-1)?.count ?? 0;
  const newYesterday = stats.newPerDay.at(-2)?.count ?? 0;

  return (
    <>
      {/* Øverst: personlig hilsen, dagens status i klar tekst og den primaere
          handling. Alt synligt uden at scrolle, ogsaa paa mobil. */}
      <section className="relative mb-6 overflow-hidden rounded-lg border border-fog bg-white shadow-lift animate-step">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-[90px]"
          style={{ background: business.primaryColor, opacity: 0.12 }}
        />
        <div className="relative flex flex-col gap-6 p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0">
              <p className="text-label font-[400] uppercase tracking-[0.14em] text-terracotta">
                {dateLabel}
              </p>
              <h1 className="mt-2 font-[300] text-[1.9rem] leading-tight tracking-[0.01em] text-ink">
                {greeting}, {business.name}
              </h1>
              <p className="mt-1.5 max-w-lg font-[300] text-[0.95rem] leading-relaxed text-stone">
                {summary}
              </p>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {isNew ? (
              <>
                <ButtonLink
                  href="/app/kom-i-gang"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                >
                  Opsætning
                </ButtonLink>
                <ButtonLink
                  href="/app/materialer"
                  variant="outline"
                  className="w-full justify-center sm:w-auto"
                >
                  Del dit kort
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink
                  href="/app/kasse"
                  variant="primary"
                  className="w-full justify-center sm:w-auto"
                >
                  Giv et stempel
                </ButtonLink>
                <AddEmployeeButton
                  className={`${btnClass("outline")} w-full justify-center sm:w-auto`}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {isNew ? (
        <div className="flex flex-col gap-6">
          {/* Tom tilstand for en helt ny butik: forklar hvad der kommer, i
              stedet for at vise fire nul-tal. */}
          <Panel>
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-4 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                <IconStamp />
              </span>
              <h2 className="font-[300] text-[1.25rem] text-ink">
                Jeres overblik fyldes af sig selv
              </h2>
              <p className="max-w-sm font-[300] text-[0.88rem] leading-relaxed text-stone">
                Så snart den første kunde henter kortet og får et stempel, ser I
                besøg, genbesøg og indløste belønninger her.
              </p>
            </div>
          </Panel>
          <RecommendationCard rec={rec} />
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {/* Dernaest: faa centrale noegletal, hver med sammenligning til i gaar */}
          <div>
            <SectionHeader
              title="I dag"
              action={
                <Link
                  href="/app/statistik"
                  className="inline-flex items-center gap-1.5 text-[0.74rem] font-[400] uppercase tracking-[0.08em] text-terracotta transition-opacity hover:opacity-70"
                >
                  Se al statistik
                  <CtaArrow />
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <PulseTile
                label="Stempler i dag"
                value={stampsToday}
                yesterday={stampsYesterday}
                sub="Stempler givet i dag"
                icon={<IconStamp />}
              />
              <PulseTile
                label="Nye kortholdere"
                value={newToday}
                yesterday={newYesterday}
                sub="Har hentet kortet i dag"
                icon={<IconSpark />}
              />
              <PulseTile
                label="Genbesøg"
                value={pulse.returningToday}
                yesterday={pulse.returningYesterday}
                sub="Kunder der har været her før"
                icon={<IconUsers />}
              />
              <PulseTile
                label="Indløst i dag"
                value={pulse.redemptionsToday}
                yesterday={pulse.redemptionsYesterday}
                sub="Belønninger indløst i dag"
                icon={<IconGift />}
              />
            </div>
          </div>

          {/* Dernaest: seneste aktivitet som en let laesbar tidslinje */}
          <div>
            <SectionHeader title="Seneste aktivitet" />
            <Panel>
              {activity.length === 0 ? (
                <p className="py-2 font-[300] text-[0.86rem] text-slate">
                  Ingen aktivitet endnu. Sæt QR-koden op ved kassen, så begynder
                  dagen at tælle.
                </p>
              ) : (
                <ol className="flex flex-col">
                  {activity.map((a, i) => {
                    const isAlert =
                      a.action === "FLAGGED" || a.action === "PIN_FAIL";
                    const isLast = i === activity.length - 1;
                    return (
                      <li
                        key={a.id}
                        className="relative flex items-start gap-3 pl-5 pb-4 last:pb-0"
                      >
                        {!isLast ? (
                          <span
                            aria-hidden
                            className="absolute left-[3px] top-3 h-full w-px bg-fog"
                          />
                        ) : null}
                        <span
                          aria-hidden
                          className={cn(
                            "absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full",
                            isAlert ? "bg-rust" : "bg-terracotta",
                          )}
                        />
                        <div className="flex flex-1 items-baseline justify-between gap-3">
                          <span
                            className={cn(
                              "text-[0.86rem] font-[300]",
                              isAlert ? "text-rust" : "text-ink",
                            )}
                          >
                            {ACTION_LABEL[a.action] ?? a.action}
                          </span>
                          <span className="shrink-0 text-[0.72rem] font-[300] text-slate">
                            {relativeDk(a.createdAt)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </Panel>
          </div>

          {/* Til sidst: den ene kontekstuelle anbefaling */}
          <RecommendationCard rec={rec} />

          <AddToHomeHint />
        </div>
      )}
    </>
  );
}
