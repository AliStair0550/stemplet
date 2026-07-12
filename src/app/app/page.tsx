import Link from "next/link";
import type { Plan } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ButtonLink } from "@/components/ui";
import { CopyInline } from "@/components/CopyInline";
import { APP_URL } from "@/lib/env";
import { FREE_CUSTOMER_LIMIT, FREE_CUSTOMER_WARN } from "@/lib/plans";
import { formatDkNumber, relativeDk } from "@/lib/utils";

// Varsl foer muren: fra 80 kunder viser vi vaerdien og opgraderingsknappen,
// saa salget starter paa "se hvad de har givet dig" - ikke paa tvang.
function CustomerLimitNotice({ plan, total }: { plan: Plan; total: number }) {
  if (plan !== "FREE" || total < FREE_CUSTOMER_WARN) return null;
  const atWall = total >= FREE_CUSTOMER_LIMIT;
  return (
    <div className="mb-6 rounded-sm border border-moss bg-moss/5 p-6">
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
      title: "Prøv kassen",
      body: "Vis stempel-QR'en, eller scan et kundekort.",
      href: "/app/kasse",
      link: "Åbn kasse",
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
    getRecentActivity(business.id, 10),
  ]);

  return (
    <>
      <PageHeading
        title={`Hej, ${business.name}`}
        subtitle="Her er, hvordan dit stempelkort klarer sig."
        action={
          <ButtonLink href="/app/kasse" variant="moss" size="md">
            Åbn kasse
          </ButtonLink>
        }
      />

      <CustomerLimitNotice plan={business.plan} total={stats.totalCustomers} />

      {stats.stampsTotal === 0 ? <GettingStarted slug={business.slug} /> : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Aktive kunder"
          value={<AnimatedNumber value={stats.activeCustomers} />}
          sub={`${formatDkNumber(stats.totalCustomers)} i alt`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          value={<AnimatedNumber value={stats.newCustomers30} />}
        />
        <StatTile
          label="Stempler i dag"
          value={<AnimatedNumber value={stats.stampsToday} />}
          sub={`${formatDkNumber(stats.stampsWeek)} seneste 7 dage`}
        />
        <StatTile
          label="Indløsninger"
          value={<AnimatedNumber value={stats.redemptionsTotal} />}
          sub={`${formatDkNumber(stats.redemptions30)} seneste 30 dage`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel>
          <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
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
          <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Seneste aktivitet
          </h2>
          {activity.length === 0 ? (
            <p className="font-[200] text-[0.85rem] text-slate">
              Ingen aktivitet endnu. Sæt din QR op ved kassen.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activity.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 border-b border-fog pb-2 last:border-0"
                >
                  <span
                    className={`text-[0.82rem] font-[300] ${
                      a.action === "FLAGGED" || a.action === "PIN_FAIL"
                        ? "text-moss"
                        : "text-ink"
                    }`}
                  >
                    {ACTION_LABEL[a.action] ?? a.action}
                  </span>
                  <span className="shrink-0 text-[0.72rem] font-[200] text-slate">
                    {relativeDk(a.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
