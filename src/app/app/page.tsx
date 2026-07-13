import Link from "next/link";
import type { Plan } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ButtonLink } from "@/components/ui";
import { CopyInline } from "@/components/CopyInline";
import { APP_URL } from "@/lib/env";
import { FREE_CUSTOMER_LIMIT, FREE_CUSTOMER_WARN } from "@/lib/plans";
import { formatDkNumber, relativeDk } from "@/lib/utils";

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

// Varsl foer muren: fra 80 kunder viser vi vaerdien og opgraderingsknappen,
// saa salget starter paa "se hvad de har givet dig" - ikke paa tvang.
function CustomerLimitNotice({ plan, total }: { plan: Plan; total: number }) {
  if (plan !== "FREE" || total < FREE_CUSTOMER_WARN) return null;
  const atWall = total >= FREE_CUSTOMER_LIMIT;
  return (
    <div className="mb-6 rounded-lg border border-moss bg-moss/5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-[400] text-[1rem] text-ink">
            {atWall
              ? `Du har taget imod ${FREE_CUSTOMER_LIMIT} kunder 🎉`
              : `Du nærmer dig ${FREE_CUSTOMER_LIMIT} kunder. Flot!`}
          </p>
          <p className="mt-1 max-w-xl font-[200] text-[0.85rem] leading-relaxed text-stone">
            {atWall
              ? "Dine nuværende kunder stempler og indløser videre præcis som før. Vil du tage imod endnu flere, åbner Pro for ubegrænset antal kort, og viser dig, hvem der er dine stamkunder, og hvem der er ved at forsvinde."
              : `Du har ${formatDkNumber(total)} kunder. Se hvad de allerede har givet dig, og lås op for ubegrænset antal kort med Pro, når du er klar.`}
          </p>
        </div>
        <ButtonLink href="/app/indstillinger" variant="moss" size="md">
          {atWall ? "Åbn for flere med Pro" : "Se Pro"}
        </ButtonLink>
      </div>
    </div>
  );
}

function GettingStarted({ slug }: { slug: string }) {
  const customerUrl = `${APP_URL}/k/${slug}`;
  const customerUrlShort = `${APP_URL.replace(/^https?:\/\//, "")}/k/${slug}`;
  const steps = [
    {
      title: "Print din QR",
      body: "Hent plakat eller diskskilt og sæt den ved kassen.",
      href: "/app/materialer",
      link: "Materialer",
    },
    {
      title: "Giv et stempel",
      body: "Vis stempel-QR'en, eller scan et kundekort.",
      href: "/app/kasse",
      link: "Åbn Stempel",
    },
    {
      title: "Del dit kort",
      body: "Send linket, eller læg det på sociale medier.",
      copy: { value: customerUrl, display: customerUrlShort },
      href: `/k/${slug}`,
      link: "Se kundesiden",
    },
  ];
  return (
    <Panel className="mb-6 border-moss/40 bg-moss/[0.04]">
      <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-moss">
        Kom godt i gang
      </h2>
      <ol className="mt-5 grid gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-moss font-fraunces text-[0.9rem] font-light italic text-moss">
              {i + 1}
            </span>
            <span className="font-[400] text-[0.95rem] text-ink">{s.title}</span>
            <span className="break-words font-[200] text-[0.82rem] leading-relaxed text-stone">
              {s.body}
            </span>
            {s.copy ? (
              <CopyInline value={s.copy.value} display={s.copy.display} />
            ) : null}
            <Link
              href={s.href}
              className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-moss hover:opacity-70"
            >
              {s.link}
            </Link>
          </li>
        ))}
      </ol>
    </Panel>
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
    stats.stampsToday > 0
      ? `${formatDkNumber(stats.stampsToday)} ${stats.stampsToday === 1 ? "stempel" : "stempler"} i dag, og ${formatDkNumber(stats.activeCustomers)} aktive kunder lige nu.`
      : `${formatDkNumber(stats.activeCustomers)} aktive kunder. Vis stempel-QR'en ved kassen, så begynder dagen at tælle.`;

  return (
    <>
      {/* Velkomst-band: butikkens brand-glimt, dato og status i et roligt panel */}
      <div className="relative mb-6 overflow-hidden rounded-lg border border-fog bg-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full blur-[90px]"
          style={{ background: business.primaryColor, opacity: 0.12 }}
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5 p-6 md:p-8">
          <div className="min-w-0">
            <p className="text-label font-[400] uppercase tracking-[0.14em] text-moss">
              {dateLabel}
            </p>
            <h1 className="mt-2 font-[300] text-[1.9rem] leading-tight tracking-[0.01em] text-ink">
              Hej, {business.name}
            </h1>
            <p className="mt-1.5 max-w-md font-[300] text-[0.9rem] leading-relaxed text-stone">
              {statusLine}
            </p>
          </div>
          <ButtonLink href="/app/kasse" variant="moss" size="md">
            Stempel
          </ButtonLink>
        </div>
      </div>

      <CustomerLimitNotice plan={business.plan} total={stats.totalCustomers} />

      {stats.stampsTotal === 0 ? <GettingStarted slug={business.slug} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Aktive kunder"
          icon={<IconUsers />}
          value={<AnimatedNumber value={stats.activeCustomers} />}
          sub={`${formatDkNumber(stats.totalCustomers)} i alt`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          icon={<IconSpark />}
          value={<AnimatedNumber value={stats.newCustomers30} />}
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

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
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
            Seneste aktivitet
          </h2>
          {activity.length === 0 ? (
            <p className="font-[300] text-[0.85rem] text-slate">
              Ingen aktivitet endnu. Sæt din QR op ved kassen.
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
  );
}
