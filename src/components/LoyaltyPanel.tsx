import { Panel } from "@/components/dash";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { cn } from "@/lib/utils";

export type Loyalty = {
  topStamps: number;
  over50: number;
  over100: number;
  over250: number;
};

// Stamkunde-niveauer: farven eskalerer med troskab, saa 250+ faar samme guld
// som beloenningen paa selve stempelkortet (prestige, konsekvent med Wallet).
const TIERS = [
  { key: "over50", label: "50+ stempler", note: "trofaste", dot: "bg-terracotta/40" },
  { key: "over100", label: "100+ stempler", note: "stamkunder", dot: "bg-terracotta" },
  { key: "over250", label: "250+ stempler", note: "ambassadører", dot: "bg-[#C9A24B]" },
] as const;

/** Overblik over de mest loyale kunder: rekordholder + antal pr. niveau. */
export function LoyaltyPanel({ loyalty }: { loyalty: Loyalty }) {
  return (
    <Panel>
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
          Stamkunder
        </h2>
        <span className="text-[0.72rem] font-[300] text-slate">
          Samlede stempler pr. kunde
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-terracotta/40 bg-terracotta/[0.05] p-4">
          <span className="text-label font-[400] uppercase tracking-[0.12em] text-terracotta">
            Flest hos én kunde
          </span>
          <div className="mt-2 font-[300] text-[1.8rem] leading-none text-ink tabular-nums">
            <AnimatedNumber value={loyalty.topStamps} />
          </div>
          <span className="mt-1.5 block text-[0.72rem] font-[300] text-stone">
            din mest trofaste kunde
          </span>
        </div>
        {TIERS.map((t) => (
          <div
            key={t.key}
            className="rounded-lg border border-fog bg-parchment/60 p-4"
          >
            <span className="flex items-center gap-1.5 text-label font-[400] uppercase tracking-[0.12em] text-slate">
              <span className={cn("h-2 w-2 shrink-0 rounded-full", t.dot)} />
              {t.label}
            </span>
            <div className="mt-2 font-[300] text-[1.8rem] leading-none text-ink tabular-nums">
              <AnimatedNumber value={loyalty[t.key]} />
            </div>
            <span className="mt-1.5 block text-[0.72rem] font-[300] text-stone">
              {t.note}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}
