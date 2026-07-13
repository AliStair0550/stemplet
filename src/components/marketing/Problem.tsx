import { Section } from "@/components/ui";

const OLD = [
  "Ryger i skuffen og er væk, før det er fyldt.",
  "Håndstemplet, alle kan tegne det efter.",
  "Nul data. Du ved ikke, hvem der kommer igen.",
  "Ude af syne i lommen, og din butik glemt.",
];

const NEW = [
  "Ligger i Apple Wallet, altid ét swipe fra kassen.",
  "Hvert stempel er signeret og gælder kun én gang.",
  "Statistik i realtid: genbesøg, stempler og indløsninger.",
  "Dit brand dukker op, hver gang kunden åbner sin telefon.",
];

const STATS = [
  { value: "68%", label: "vender tilbage" },
  { value: "1.240", label: "stempler i år" },
  { value: "94", label: "belønninger indløst" },
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

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {/* Papkortet: dæmpet, det man forlader */}
        <div className="rounded-lg border border-clay bg-parchment/50 p-8 md:p-10">
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

        {/* Stemplet: løftet, med moss-accent, det man vælger */}
        <div className="rounded-lg border border-moss/25 bg-white p-8 shadow-[0_22px_54px_-30px_rgba(45,95,74,0.5)] md:p-10">
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

      {/* Statistik-callout: det papkortet aldrig kunne give dig */}
      <div className="mt-5 overflow-hidden rounded-lg bg-ink p-8 text-parchment md:p-10">
        <div className="flex flex-col gap-9 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-sm">
            <span className="text-[0.65rem] font-[400] uppercase tracking-[0.14em] text-moss-light">
              Din statistik
            </span>
            <p className="mt-3 font-[300] text-[0.95rem] leading-[1.75] text-parchment/80">
              Papkortet fortæller dig intet. Stemplet viser sort på hvidt, hvor
              mange der kommer igen, og du bliver husket, hver gang kunden åbner
              sin Wallet.
            </p>
          </div>
          <div className="grid shrink-0 grid-cols-3 gap-8 md:gap-12">
            {STATS.map((s) => (
              <div key={s.label}>
                <div className="font-fraunces text-[1.9rem] font-light leading-none text-parchment">
                  {s.value}
                </div>
                <div className="mt-2 font-[300] text-[0.72rem] leading-tight text-parchment/60">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
