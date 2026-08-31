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
import { cn, formatDkNumber, relativeDk } from "@/lib/utils";
import { contrastText, rgba, shade } from "@/lib/brand";
import { AddToHomeHint } from "./AddToHomeHint";
import {
  CtaArrow,
  IconCard,
  IconChart,
  IconDesign,
  IconGift,
  IconKey,
  IconQr,
  IconSpark,
  IconStamp,
  IconStampMark,
  IconUsers,
} from "./icons";

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
    // "Aktiv" bruges KUN om kortholdere der faktisk har faaet et stempel for
    // nylig (activeCustomers = stemplet inden for 60 dage). Har ingen et stempel
    // endnu, siger vi neutralt "kortholdere, klar til det foerste stempel", saa
    // et tomt kort ikke fremstaar som en engageret kunde.
    if (p.activeCustomers > 0) {
      return `Ingen stempler endnu i dag. I har ${formatDkNumber(
        p.activeCustomers,
      )} ${
        p.activeCustomers === 1 ? "aktiv kortholder" : "aktive kortholdere"
      }, klar til et genbesøg.`;
    }
    return `Ingen stempler endnu i dag. I har ${formatDkNumber(
      p.totalCustomers,
    )} ${
      p.totalCustomers === 1 ? "kortholder" : "kortholdere"
    }, klar til det første stempel.`;
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

// Genvejene i Overblik. EEN kilde til titel, undertekst, maal og ikon, saa
// gridet er let at pleje. "Adgang" sender ind til adgang-sektionen i
// indstillinger (login-mails + kasse-enheder).
type Action = {
  href: string;
  label: string;
  sub: string;
  icon: ReactNode;
};

const ACTIONS: Action[] = [
  {
    href: "/app/materialer",
    label: "Del dit kort",
    sub: "QR-kode og link til kunderne",
    icon: <IconQr />,
  },
  {
    href: "/app/indstillinger#adgang",
    label: "Adgang",
    sub: "Medarbejdere og kasse-enheder",
    icon: <IconKey />,
  },
  {
    href: "/app/kort",
    label: "Design",
    sub: "Farver, logo og belønning",
    icon: <IconDesign />,
  },
  {
    href: "/app/kampagner",
    label: "Kampagner",
    sub: "Påmindelser og tilbud",
    icon: <IconGift />,
  },
  {
    href: "/app/statistik",
    label: "Statistik",
    sub: "Besøg, genbesøg og belønninger",
    icon: <IconChart />,
  },
  {
    href: "/app/visitkort",
    label: "Visitkort",
    sub: "Tryk-klare kort til disken",
    icon: <IconCard />,
  },
];

// Den store, primaere genvej: giv et stempel. Fyldt i butikkens EGEN brandfarve
// med en let gradient, og tekstfarven vaelges automatisk (lys eller moerk), saa
// den altid er laesbar, ogsaa paa en lys brandfarve.
function StampAction({ primaryColor }: { primaryColor: string }) {
  const fg = contrastText(primaryColor);
  return (
    <Link
      href="/app/kasse"
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift md:p-6"
      style={{
        color: fg,
        background: `linear-gradient(135deg, ${primaryColor}, ${shade(primaryColor, -0.18)})`,
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full blur-2xl"
        style={{ background: rgba(fg, 0.12) }}
      />
      <span
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
        style={{ background: rgba(fg, 0.16) }}
      >
        <IconStampMark className="h-6 w-6" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-[400] text-[1.15rem] leading-tight">
          Giv et stempel
        </span>
        <span
          className="mt-0.5 block font-[300] text-[0.85rem] leading-relaxed"
          style={{ color: rgba(fg, 0.82) }}
        >
          Åbn kassen og stempel en kunde
        </span>
      </span>
      <span
        className="relative shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
        style={{ color: rgba(fg, 0.82) }}
      >
        <CtaArrow />
      </span>
    </Link>
  );
}

// De sekundaere genveje som et rent, luftigt kort-grid.
function ActionTile({ action }: { action: Action }) {
  return (
    <Link
      href={action.href}
      className="group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-fog bg-gradient-to-b from-white to-sand/40 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:shadow-lift"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-parchment">
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-[400] text-[1rem] text-ink">
          {action.label}
          <span className="text-terracotta/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-terracotta">
            <CtaArrow />
          </span>
        </span>
        <span className="mt-0.5 block font-[300] text-[0.8rem] leading-relaxed text-stone">
          {action.sub}
        </span>
      </span>
    </Link>
  );
}

function ActionGrid({ primaryColor }: { primaryColor: string }) {
  return (
    <section className="animate-step">
      <StampAction primaryColor={primaryColor} />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {ACTIONS.map((a) => (
          <ActionTile key={a.href} action={a} />
        ))}
      </div>
    </section>
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
              <p className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
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
        </div>
      </section>

      {/* Hjertet i Overblik: flotte genveje til de vigtigste handlinger, saa
          ejeren med det samme kan stemple, dele kortet, styre adgang m.m. */}
      <ActionGrid primaryColor={business.primaryColor} />

      {isNew ? null : (
        <div className="mt-10 flex flex-col gap-9">
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

          <AddToHomeHint />
        </div>
      )}
    </>
  );
}
