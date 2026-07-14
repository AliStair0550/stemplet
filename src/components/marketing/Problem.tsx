import { Section } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StatsScene } from "./StatsScene";

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

      {/* Statistik-callout: levende moss-gradient med en animeret kasse-scene,
          hvor kortet faar en masse stempler. */}
      <div className="mt-14 overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E6350] via-[#244d3f] to-[#183a2d] p-8 text-parchment shadow-[0_30px_70px_-30px_rgba(45,95,74,0.75)] md:p-11">
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
              {STATS.map((s, i) => (
                <div key={s.label}>
                  <div
                    className={cn(
                      "font-fraunces text-[2rem] font-light leading-none",
                      i === 0 ? "text-[#EBC985]" : "text-parchment",
                    )}
                  >
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
            <StatsScene />
          </div>
        </div>
      </div>
    </Section>
  );
}
