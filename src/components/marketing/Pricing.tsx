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
      className="mt-[3px] h-4 w-4 shrink-0 text-moss"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const FREE = [
  "1 stempelkort",
  "Op til 50 aktive kunder",
  "Stempler i Apple Wallet",
  "Drevet af Stemplet på kortet",
];

const PRO = [
  "Ubegrænset antal kort",
  "Ubegrænset antal kunder",
  "Dit eget brand, uden Stemplet-logo",
  "Kampagner og bonusstempler",
  "Fuld statistik",
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
          Enkel pris. Ingen binding.
        </h2>
      </div>

      <div className="mt-14 grid gap-6 md:grid-cols-2">
        {/* Gratis */}
        <div className="flex flex-col border border-clay bg-parchment p-8 md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-slate">
            Gratis
          </span>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-[300] text-[2.6rem] leading-none tabular-nums text-ink">
              0 kr.
            </span>
            <span className="font-[200] text-[0.85rem] text-slate">/md.</span>
          </div>
          <p className="mt-4 font-[200] text-[0.88rem] leading-[1.7] text-stone">
            Alt du skal bruge for at komme i gang med dit første kort.
          </p>
          <Features items={FREE} />
          <div className="mt-8 pt-2">
            <ButtonLink
              href="/start"
              variant="outline"
              size="lg"
              className="w-full"
            >
              Start gratis
            </ButtonLink>
          </div>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col border border-moss bg-parchment p-8 md:p-10">
          <span className="absolute right-8 top-8 md:right-10 md:top-10">
            <span className="bg-moss px-3 py-1 font-[300] text-[0.62rem] uppercase tracking-[0.12em] text-parchment">
              Anbefalet
            </span>
          </span>
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-moss">
            Pro
          </span>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-[300] text-[2.6rem] leading-none tabular-nums text-ink">
              {PRO_PRICE_DKK} kr.
            </span>
            <span className="font-[200] text-[0.85rem] text-slate">/md.</span>
          </div>
          <p className="mt-4 font-[200] text-[0.88rem] leading-[1.7] text-stone">
            Dit eget brand, ubegrænset vækst og fuld indsigt.
          </p>
          <Features items={PRO} />
          <div className="mt-8 pt-2">
            <ButtonLink
              href="/start"
              variant="primary"
              size="lg"
              className="w-full"
            >
              Vælg Pro
            </ButtonLink>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-xl text-center font-[200] text-[0.85rem] leading-[1.8] text-stone">
        Ingen binding. Intet kreditkort for at starte. {PRO_PRICE_DKK} kr. er
        mindre end én genkøbt kunde om måneden.
      </p>
    </Section>
  );
}
