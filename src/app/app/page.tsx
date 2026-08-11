import type { ReactNode } from "react";
import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { StatTile, Panel, SectionHeader } from "@/components/dash";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ButtonLink } from "@/components/ui";
import { formatDkNumber, relativeDk } from "@/lib/utils";
import { AddToHomeHint } from "./AddToHomeHint";
import { GettingStarted } from "./GettingStarted";
import {
  CtaArrow,
  IconDesign,
  IconDevice,
  IconQr,
  IconShare,
  IconSpark,
  IconStamp,
  IconUsers,
} from "./icons";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

// Genvej til en vigtig ejer-handling (design, materialer, enheder, deling).
function HubCard({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-lg border border-fog bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-terracotta/40 hover:shadow-lift"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-[400] text-[0.98rem] text-ink">
          {title}
          <span className="text-terracotta transition-transform group-hover:translate-x-0.5">
            <CtaArrow />
          </span>
        </span>
        <span className="mt-1 block font-[300] text-[0.83rem] leading-relaxed text-stone">
          {body}
        </span>
      </span>
    </Link>
  );
}

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
      {/* Velkomst-band: butikkens brand-glimt, dato og status. Loeftet frem som
          sidens hero med bloed skygge. */}
      <div className="relative mb-6 overflow-hidden rounded-lg border border-fog bg-white shadow-lift">
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
        <GettingStarted />
      ) : (
        <>
          <AddToHomeHint />

          {/* Essentielle noegletal. Det fulde overblik ligger paa Statistik. */}
          <SectionHeader
            title="Nøgletal"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile
              label="Kortholdere i alt"
              icon={<IconUsers />}
              value={<AnimatedNumber value={stats.totalCustomers} />}
              sub={`${formatDkNumber(stats.activeCustomers)} aktive seneste 60 dage`}
            />
            <StatTile
              label="Nye kunder (7 dage)"
              icon={<IconSpark />}
              value={<AnimatedNumber value={stats.newCustomers7} />}
              sub={`${formatDkNumber(stats.newCustomers30)} seneste 30 dage`}
            />
            <StatTile
              label="Stempler i dag"
              icon={<IconStamp />}
              value={<AnimatedNumber value={stats.stampsToday} />}
              sub={`${formatDkNumber(stats.stampsWeek)} seneste 7 dage`}
            />
          </div>

          {/* Vigtigt for dig: genveje til de centrale ejer-handlinger */}
          <div className="mt-9">
            <SectionHeader title="Vigtigt for dig" />
            <div className="grid gap-4 sm:grid-cols-2">
              <HubCard
                href="/app/kort"
                icon={<IconDesign />}
                title="Dit design"
                body="Se og ret dit stempelkort: navn, farver, logo og belønning."
              />
              <HubCard
                href="/app/materialer"
                icon={<IconQr />}
                title="QR og skilte"
                body="Hent din QR-kode og print skilte til at sætte op i butikken."
              />
              <HubCard
                href="/app/indstillinger#kasse-enheder"
                icon={<IconDevice />}
                title="Kasse-enheder"
                body="Giv personalet adgang og par flere enheder, der kan stemple."
              />
              <HubCard
                href="/app/kampagner"
                icon={<IconShare />}
                title="Del kortet"
                body="Del kortet på Instagram og Facebook, så kunderne henter det hjemmefra."
              />
            </div>
          </div>

          {/* Seneste aktivitet: en kompakt puls, det fulde ligger paa Statistik */}
          <div className="mt-9">
            <SectionHeader title="Seneste aktivitet" />
            <Panel>
              {activity.length === 0 ? (
                <p className="font-[300] text-[0.85rem] text-slate">
                  Ingen aktivitet endnu. Sæt dit skilt op ved kassen.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {activity.map((a) => {
                    const isAlert =
                      a.action === "FLAGGED" || a.action === "PIN_FAIL";
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
