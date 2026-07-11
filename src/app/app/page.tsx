import Link from "next/link";
import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { ButtonLink } from "@/components/ui";
import { APP_URL } from "@/lib/env";
import { formatDkNumber, relativeDk } from "@/lib/utils";

function GettingStarted({ slug }: { slug: string }) {
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
      body: `Kundens link: ${APP_URL.replace(/^https?:\/\//, "")}/k/${slug}`,
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
            Stempler seneste 14 dage
          </h2>
          <BarChart data={stats.perDay} />
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
