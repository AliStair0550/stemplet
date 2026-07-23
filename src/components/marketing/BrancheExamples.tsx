import type { BrancheExample } from "@/lib/brancher";

// Levende opsaetnings-eksempler ved CTA'en: maalrettede "hvad udloeser hvad"-kort
// for netop den branche (belOnningen er altid butikkens eget valg). Terracotta-
// badgen pulserer blOdt (uendelig, staggeret via inline delay), saa raekken
// foeles levende. Ren CSS, server-komponent. Respekterer prefers-reduced-motion
// via .branche-example-badge i globals.css.
export function BrancheExamples({ examples }: { examples: BrancheExample[] }) {
  return (
    <div className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-3">
      {examples.map((ex, i) => (
        <div
          key={ex.reward}
          className="flex w-[9.75rem] flex-col items-center gap-2 rounded-xl border border-clay bg-white/70 px-4 py-4 text-center shadow-card"
        >
          <span
            className="branche-example-badge inline-flex rounded-full bg-terracotta/10 px-3 py-1 text-[0.7rem] font-medium uppercase tracking-[0.06em] text-terracotta"
            style={{ animationDelay: `${i * 0.55}s` }}
          >
            {ex.target}
          </span>
          <span className="text-[0.96rem] font-[500] leading-snug text-ink">
            {ex.reward}
          </span>
        </div>
      ))}
    </div>
  );
}
