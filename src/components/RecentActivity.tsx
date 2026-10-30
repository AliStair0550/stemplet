import { Panel, SectionHeader } from "@/components/dash";
import { cn, relativeDk } from "@/lib/utils";

const ACTION_LABEL: Record<string, string> = {
  STAMP: "Stempel givet",
  REDEEM: "Belønning indløst",
  PIN_FAIL: "Forkert PIN",
  FLAGGED: "Mistænkelig aktivitet",
};

/** Seneste aktivitet (stempler, indloesninger, advarsler) som en let laesbar tidslinje. */
export function RecentActivity({ activity }: { activity: { id: string; action: string; createdAt: Date }[] }) {
  return (
    <div>
      <SectionHeader title="Seneste aktivitet" />
      <Panel>
        {activity.length === 0 ? (
          <p className="py-2 font-[300] text-[0.86rem] text-slate">
            Ingen aktivitet endnu. Sæt QR-koden op ved kassen, så begynder dagen at tælle.
          </p>
        ) : (
          <ol className="flex flex-col">
            {activity.map((a, i) => {
              const isAlert = a.action === "FLAGGED" || a.action === "PIN_FAIL";
              const isLast = i === activity.length - 1;
              return (
                <li key={a.id} className="relative flex items-start gap-3 pl-5 pb-4 last:pb-0">
                  {!isLast ? <span aria-hidden className="absolute left-[3px] top-3 h-full w-px bg-fog" /> : null}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-0 top-[7px] h-[7px] w-[7px] rounded-full",
                      isAlert ? "bg-rust" : "bg-terracotta",
                    )}
                  />
                  <div className="flex flex-1 items-baseline justify-between gap-3">
                    <span className={cn("text-[0.86rem] font-[300]", isAlert ? "text-rust" : "text-ink")}>
                      {ACTION_LABEL[a.action] ?? a.action}
                    </span>
                    <span className="shrink-0 text-[0.72rem] font-[300] text-slate">{relativeDk(a.createdAt)}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </div>
  );
}
