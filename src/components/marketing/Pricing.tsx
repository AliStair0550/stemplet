import { Section, Eyebrow, ButtonLink } from "@/components/ui";
import { PRO_PRICE_DKK, FREE_CUSTOMER_LIMIT } from "@/lib/plans";

function Check() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[3px] h-4 w-4 shrink-0 text-moss"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const FREE = [
  `Op til ${FREE_CUSTOMER_LIMIT} aktive kunder`,
  "Alle funktioner fra dag ét",
  "Dit eget brand, uden Stemplet-logo",
  "Kampagner og fuld statistik",
  "Stempler i Apple Wallet",
];

const PRO = [
  "Ubegrænset antal kunder",
  "Alt det samme som Gratis, uden loft",
  `Aktiveres først ved over ${FREE_CUSTOMER_LIMIT} kunder`,
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
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Gratis op til {FREE_CUSTOMER_LIMIT} kunder. Alt er med.
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Gratis */}
        <div className="flex flex-col border border-moss bg-parchment p-8 md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-moss">
            Gratis
          </span>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-[300] text-[2.6rem] leading-none tabular-nums text-ink">
              0 kr.
            </span>
            <span className="font-[200] text-[0.85rem] text-slate">/md.</span>
          </div>
          <p className="mt-4 font-[200] text-[0.88rem] leading-[1.7] text-stone">
            Alle funktioner, dit eget brand og fuld indsigt. Op til{" "}
            {FREE_CUSTOMER_LIMIT} aktive kunder.
          </p>
          <Features items={FREE} />
          <div className="mt-auto pt-8">
            <ButtonLink
              href="/start"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Start gratis
            </ButtonLink>
          </div>
        </div>

        {/* Pro */}
        <div className="flex flex-col border border-clay bg-parchment p-8 md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-slate">
            Pro
          </span>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-[300] text-[2.6rem] leading-none tabular-nums text-ink">
              {PRO_PRICE_DKK} kr.
            </span>
            <span className="font-[200] text-[0.85rem] text-slate">/md.</span>
          </div>
          <p className="mt-4 font-[200] text-[0.88rem] leading-[1.7] text-stone">
            Samme produkt, uden kundeloft. Du overgår automatisk, når du
            passerer {FREE_CUSTOMER_LIMIT} aktive kunder.
          </p>
          <Features items={PRO} />
          <div className="mt-8 pt-2">
            <ButtonLink
              href="/start"
              variant="outline"
              size="lg"
              className="w-full"
            >
              Kom i gang
            </ButtonLink>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center font-[200] text-[0.85rem] leading-[1.8] text-stone">
        Ingen binding. Intet kreditkort for at starte. Du betaler først{" "}
        {PRO_PRICE_DKK} kr./md., hvis du passerer {FREE_CUSTOMER_LIMIT} aktive
        kunder. Mindre end én genkøbt kunde om måneden.
      </p>
    </Section>
  );
}
