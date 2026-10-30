import { Section, Eyebrow, ButtonLink } from "@/components/ui";
import { PRO_PRICE_DKK } from "@/lib/plans";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[3px] h-4 w-4 shrink-0 text-terracotta"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const INCLUDED = [
  "Stempler, henvisninger og beskeder",
  "Ubegrænset antal kortholdere",
  "Dit eget design, intet logo fra os",
  "Tilbud, kampagner og statistik",
];

function Features({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 flex flex-col gap-4">
      {items.map((f) => (
        <li key={f} className="flex gap-3">
          <Check />
          <span className="font-[300] text-[0.9rem] leading-[1.6] text-stone">
            {f}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Pricing() {
  return (
    <Section id="pris" className="scroll-mt-24 bg-sand">
      <div className="max-w-xl">
        <Eyebrow>Pris</Eyebrow>
        <h2 className="mt-4 font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
          Tre måneder gratis. Derefter {PRO_PRICE_DKK} kr. om måneden.
        </h2>
        <p className="mt-4 font-[300] text-[0.95rem] leading-[1.7] text-stone">
          Alle tre moduler er med. Ubegrænset antal kortholdere.{" "}
          <span className="whitespace-nowrap">Prisen er ekskl. moms.</span>
        </p>
      </div>

      <div className="mt-14 max-w-xl">
        <div className="flex flex-col rounded-[24px] border border-terracotta bg-parchment p-8 md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-taupe-light">Folka Kort</span>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-[300] text-[2.6rem] leading-none tabular-nums text-ink">{PRO_PRICE_DKK} kr.</span>
            <span className="font-[200] text-[0.85rem] text-slate">/md. ekskl. moms</span>
          </div>
          <p className="mt-4 font-[200] text-[0.88rem] leading-[1.7] text-stone">De første tre måneder er gratis.</p>
          <Features items={INCLUDED} />
          <div className="mt-auto pt-8">
            <ButtonLink href="/start" variant="primary" size="lg" className="w-full">
              Opret dit kort gratis
            </ButtonLink>
          </div>
        </div>
      </div>

      <p className="mt-10 max-w-xl font-[200] text-[0.85rem] leading-[1.8] text-stone">
        Ingen binding, ingen opstartsgebyr, intet kort på forhånd.
      </p>
    </Section>
  );
}
