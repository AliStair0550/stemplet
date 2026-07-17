import { Section } from "@/components/ui";
import { StatsSceneLazy } from "./lazy";

const STATS = [
  { value: "68%", label: "vender tilbage" },
  { value: "1.240", label: "stempler i år" },
  { value: "94", label: "belønninger indløst" },
];

export default function Problem() {
  return (
    <Section className="bg-sand">
      <div className="max-w-xl">
        <h2 className="font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
          Stemplet ligger altid i din kundes{" "}
          <span className="text-terracotta">Apple Wallet</span>.
        </h2>
        <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
          Det fysiske kommer hurtigt i en skuffe. Eller smidt ud. Med Stemplet
          ligger det altid i dine kunders Wallet. Du ser genbesøg, stempler og
          indløsninger.
        </p>
      </div>

      {/* Statistik-callout: levende terracotta-gradient med en animeret kasse-scene,
          hvor kortet faar en masse stempler. */}
      <div className="mt-14 overflow-hidden rounded-[24px] bg-ink p-8 text-parchment shadow-hero md:p-11">
        <div className="flex flex-col gap-10 md:flex-row md:items-center md:justify-between md:gap-14">
          <div className="flex flex-col gap-8 md:max-w-md">
            <div>
              <span className="text-[0.65rem] font-[500] uppercase tracking-[0.16em] text-[#E7C489]">
                Din statistik
              </span>
              <p className="mt-3 font-[300] text-[0.95rem] leading-[1.75] text-parchment/85">
                Papkortet fortæller dig intet. Stemplet viser sort på hvidt, hvor
                mange der kommer igen, og du bliver husket, hver gang kunden åbner
                sin Wallet.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 sm:gap-10">
              {STATS.map((s) => (
                <div key={s.label}>
                  <div className="text-[2rem] font-bold leading-none tracking-[-0.02em] text-parchment">
                    {s.value}
                  </div>
                  <div className="mt-2 font-[300] text-[0.72rem] leading-tight text-parchment/65">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 self-center">
            <StatsSceneLazy />
          </div>
        </div>
      </div>
    </Section>
  );
}
