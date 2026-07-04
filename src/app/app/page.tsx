import { requireBusiness } from "@/lib/session";
import { getBusinessStats, getRecentActivity } from "@/lib/stats";
import { PageHeading, StatTile, Panel } from "@/components/dash";
import { BarChart } from "@/components/BarChart";
import { ButtonLink } from "@/components/ui";
import { formatDkNumber, relativeDk } from "@/lib/utils";

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Aktive kunder"
          value={formatDkNumber(stats.activeCustomers)}
          sub={`${formatDkNumber(stats.totalCustomers)} i alt`}
        />
        <StatTile
          label="Nye kunder (30 dage)"
          value={formatDkNumber(stats.newCustomers30)}
        />
        <StatTile
          label="Stempler i dag"
          value={formatDkNumber(stats.stampsToday)}
          sub={`${formatDkNumber(stats.stampsWeek)} seneste 7 dage`}
        />
        <StatTile
          label="Indløsninger"
          value={formatDkNumber(stats.redemptionsTotal)}
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
