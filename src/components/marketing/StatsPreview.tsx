import { Section, Eyebrow } from "@/components/ui";

const TILES = [
  { label: "Genbesøg", value: "68%", note: "kommer igen", delta: "+9%" },
  { label: "Stempler", value: "1.240", note: "denne måned", delta: "+18%" },
  { label: "Stamkunder", value: "34", note: "100+ stempler", delta: "+5" },
];

// Loyalitets-stribe: rekordholder + antal pr. niveau, som paa selve dashboardet.
const LOYALTY = [
  { label: "Flest hos én kunde", value: "210", dot: "bg-terracotta" },
  { label: "50+ stempler", value: "88", dot: "bg-terracotta/40" },
  { label: "100+ stempler", value: "34", dot: "bg-terracotta" },
  { label: "250+ stempler", value: "6", dot: "bg-[#C9A24B]" },
];

const BARS = [42, 55, 38, 64, 72, 58, 80, 68, 90, 76, 84, 96];

export default function StatsPreview() {
  return (
    <Section className="bg-terracotta/[0.04]">
      <div className="max-w-xl">
        <Eyebrow>Statistik</Eyebrow>
        <h2 className="mt-4 font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
          Se hvad der faktisk virker.
        </h2>
        <p className="mt-5 max-w-lg font-[200] text-[0.95rem] leading-[1.7] text-stone">
          Følg genbesøg, stempler og dine mest loyale stamkunder direkte fra
          telefonen. Ingen gætterier om, hvem der kommer igen.
        </p>
      </div>

      <div className="mt-14 rounded-lg border border-fog bg-parchment p-6 shadow-[0_24px_70px_-32px_rgba(26,26,26,0.28)] md:p-8">
        <div className="flex items-center justify-between">
          <span className="font-[400] text-[0.95rem] tracking-[0.02em] text-ink">
            Overblik
          </span>
          <span className="rounded-full border border-fog px-3.5 py-1.5 font-[300] text-[0.68rem] uppercase tracking-[0.1em] text-slate">
            Sidste 30 dage
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {TILES.map((t) => (
            <div key={t.label} className="rounded-lg border border-fog p-5">
              <span className="font-[400] text-[0.62rem] uppercase tracking-[0.12em] text-slate">
                {t.label}
              </span>
              <div className="mt-3 flex items-end gap-2">
                <span className="font-[300] text-[1.8rem] leading-none tabular-nums text-ink">
                  {t.value}
                </span>
                {t.delta ? (
                  <span className="mb-0.5 font-[300] text-[0.72rem] tabular-nums text-terracotta">
                    {t.delta}
                  </span>
                ) : null}
              </div>
              <span className="mt-2 block font-[200] text-[0.74rem] text-stone">
                {t.note}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-fog p-5">
          <span className="font-[400] text-[0.62rem] uppercase tracking-[0.12em] text-slate">
            Stamkunder
          </span>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {LOYALTY.map((l) => (
              <div key={l.label}>
                <span className="flex items-center gap-1.5 font-[300] text-[0.66rem] text-slate">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.dot}`} />
                  {l.label}
                </span>
                <span className="mt-1.5 block font-[300] text-[1.5rem] leading-none tabular-nums text-ink">
                  {l.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-fog p-5">
          <div className="flex items-center justify-between">
            <span className="font-[400] text-[0.62rem] uppercase tracking-[0.12em] text-slate">
              Stempler pr. uge
            </span>
            <span className="font-[200] text-[0.7rem] tabular-nums text-slate">
              12 uger
            </span>
          </div>
          <div className="mt-6 flex h-36 items-end gap-1.5 sm:gap-2.5">
            {BARS.map((count, i) => (
              <div
                key={i}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              >
                <span className="text-[0.5rem] font-[400] tabular-nums text-slate sm:text-[0.6rem]">
                  {count}
                </span>
                <div
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: `${(count / Math.max(...BARS)) * 100}%`,
                    background:
                      i === BARS.length - 1
                        ? "repeating-linear-gradient(135deg, #C9A24B 0 5px, #b08c3e 5px 6px)"
                        : "repeating-linear-gradient(135deg, #A6502E 0 5px, #8f4326 5px 6px)",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
