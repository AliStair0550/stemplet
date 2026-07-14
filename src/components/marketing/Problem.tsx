import { Section } from "@/components/ui";

const STATS = [
  { value: "68%", label: "vender tilbage" },
  { value: "1.240", label: "stempler i år" },
  { value: "94", label: "belønninger indløst" },
];

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

      {/* Statistik-callout: det papkortet aldrig kunne give dig */}
      <div className="mt-14 overflow-hidden rounded-lg bg-ink p-8 text-parchment md:p-10">
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
