import { Section } from "@/components/ui";

const OLD = [
  "Bliver væk, længe før det er fyldt.",
  "Et håndstempel kan alle kopiere.",
  "Du ved intet om dine kunder.",
];

const NEW = [
  "Ligger altid i Apple Wallet, klar ved kassen.",
  "Hvert stempel er signeret og gælder kun én gang.",
  "Du ser genbesøg, stempler og indløsninger.",
];

function MinusMark() {
  return (
    <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-clay">
      <span className="h-px w-2 bg-slate" />
    </span>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="mt-[2px] h-4 w-4 shrink-0 text-moss"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function Problem() {
  return (
    <Section className="bg-sand">
      <div className="max-w-xl">
        <h2 className="font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Stemplet ligger altid i din kundes{" "}
          <span className="font-fraunces font-light italic">Apple Wallet</span>.
        </h2>
        <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
          Det fysiske kommer hurtigt i en skuffe. Eller smidt ud. Med Stemplet
          ligger det altid i dine kunders Wallet. Du ser genbesøg, stempler og
          indløsninger.
        </p>
      </div>

      <div className="mt-14 grid overflow-hidden rounded-sm border border-clay md:grid-cols-2">
        <div className="border-b border-clay p-8 md:border-b-0 md:border-r md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-slate">
            Papkortet
          </span>
          <ul className="mt-7 flex flex-col gap-5">
            {OLD.map((t) => (
              <li key={t} className="flex gap-3.5">
                <MinusMark />
                <span className="font-[200] text-[0.9rem] leading-[1.7] text-stone">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-parchment p-8 md:p-10">
          <span className="font-[400] text-[0.7rem] uppercase tracking-[0.14em] text-moss">
            Stemplet
          </span>
          <ul className="mt-7 flex flex-col gap-5">
            {NEW.map((t) => (
              <li key={t} className="flex gap-3.5">
                <CheckMark />
                <span className="font-[300] text-[0.9rem] leading-[1.7] text-ink">
                  {t}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
