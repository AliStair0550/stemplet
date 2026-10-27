import type { ReactNode } from "react";
import Link from "next/link";
import { requireStampsBusiness } from "@/lib/session";
import {
  getBusinessStats,
  getRecentActivity,
  getOverviewPulse,
} from "@/lib/stats";
import { Panel, SectionHeader } from "@/components/dash";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { cn, relativeDk } from "@/lib/utils";
import { AddToHomeTile } from "../AddToHomeButton";
import { StempletLogo } from "@/components/ProductLogo";
import { summaryLine } from "@/lib/overview-text";
import {
  CtaArrow,
  IconChart,
  IconGift,
  IconKey,
  IconQr,
  IconSpark,
  IconStamp,
  IconStampMark,
  IconUsers,
} from "../icons";

export const metadata = { title: "Stemplet" };
export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

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
  icon,
}: {
  label: string;
  value: number;
  yesterday: number;
  icon: ReactNode;
}) {
  const d = deltaLabel(value, yesterday);
  const showDelta = value !== 0 || yesterday !== 0;
  return (
    <div className="group relative overflow-hidden rounded-lg border border-fog bg-gradient-to-b from-white to-sand/40 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:shadow-lift">
      <div className="flex items-start justify-between gap-2">
        <span className="text-label font-[400] uppercase tracking-[0.14em] text-stone">
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
  // Aabner i en ny fane (fx kundesiden, der ligger uden for dashboardet).
  external?: boolean;
};

const ACTIONS: Action[] = [
  {
    href: "/app/indstillinger#adgang",
    label: "Adgang",
    sub: "Medarbejdere og kasse-enheder",
    icon: <IconKey />,
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
];

// Alle genveje som et rent, luftigt kort-grid i samme boks-stil.
const tileClass =
  "group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-fog bg-gradient-to-b from-white to-sand/40 p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-clay hover:shadow-lift";

function ActionTile({ action }: { action: Action }) {
  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-parchment">
        {action.icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 font-[600] text-[1rem] text-ink">
          {action.label}
          <span className="text-terracotta/50 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-terracotta">
            <CtaArrow />
          </span>
        </span>
        <span className="mt-0.5 block font-[300] text-[0.8rem] leading-relaxed text-stone">
          {action.sub}
        </span>
      </span>
    </>
  );
  // Kundesiden ligger uden for dashboardet: aabn i ny fane, saa ejeren beholder
  // Overblik. De interne genveje bruger Next-Link.
  if (action.external) {
    return (
      <a href={action.href} target="_blank" rel="noreferrer" className={tileClass}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={action.href} className={tileClass}>
      {inner}
    </Link>
  );
}

function ActionGrid({ customerUrl }: { customerUrl: string }) {
  // "Giv et stempel" foerst (det man goer oftest), saa kundekortet, som
  // kunderne ser det. Hjemmeskaerm-boksen skjuler sig selv i den installerede app.
  const actions: Action[] = [
    {
      href: "/app/kasse",
      label: "Giv et stempel",
      sub: "Åbn kassen og stempel en kunde",
      icon: <IconStampMark />,
    },
    {
      href: customerUrl,
      label: "Se kundekort",
      sub: "Kortet, som kunderne ser det",
      icon: <IconQr />,
      external: true,
    },
    ...ACTIONS,
  ];
  return (
    <section className="grid grid-cols-2 gap-3 animate-step sm:gap-4 lg:grid-cols-3">
      {actions.map((a) => (
        <ActionTile key={a.href} action={a} />
      ))}
      <AddToHomeTile className={tileClass} />
    </section>
  );
}

export default async function StempletOverviewPage() {
  const { business } = await requireStampsBusiness();
  const [stats, activity, pulse] = await Promise.all([
    getBusinessStats(business.id),
    getRecentActivity(business.id, 6),
    getOverviewPulse(business.id),
  ]);

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
      {/* Øverst: produktets logo og dagens status i klar tekst. */}
      <header className="mb-8 border-b border-fog pb-6 animate-step">
        <h1>
          <StempletLogo className="text-[2.1rem]" />
        </h1>
        <p className="mt-3 max-w-lg font-[300] text-[0.95rem] leading-relaxed text-stone">
          {summary}
        </p>
      </header>

      {/* Hjertet i Overblik: genveje til de vigtigste handlinger. */}
      <ActionGrid customerUrl={`/k/${business.slug}`} />

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
                icon={<IconStamp />}
              />
              <PulseTile
                label="Nye kortholdere"
                value={newToday}
                yesterday={newYesterday}
                icon={<IconSpark />}
              />
              <PulseTile
                label="Genbesøg"
                value={pulse.returningToday}
                yesterday={pulse.returningYesterday}
                icon={<IconUsers />}
              />
              <PulseTile
                label="Indløst i dag"
                value={pulse.redemptionsToday}
                yesterday={pulse.redemptionsYesterday}
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
        </div>
      )}

    </>
  );
}
