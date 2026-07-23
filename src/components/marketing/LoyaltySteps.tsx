import { Section } from "@/components/ui";
import { StepTabs } from "./StepTabs";
import AnimatedStampScene from "./AnimatedStampScene";

// "Loyalitet gjort enkelt": venstrestillet overskrift + undertekst med den
// animerede demo (Odense Beer-kortet) ved siden af til hoejre, som de oevrige
// sektioner. Nedenunder: de fire trin pr. rolle (fanerne). Lys baggrund.
export default function LoyaltySteps() {
  return (
    <Section id="sådan" className="scroll-mt-24">
      <div className="md:grid md:grid-cols-2 md:items-center md:gap-12">
        <div className="max-w-xl">
          <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.7rem]">
            Loyalitet gjort enkelt.
          </h2>
          <p className="mt-5 max-w-md font-[300] text-[1rem] leading-[1.7] text-stone">
            Fra første scan til fast gæst. Stemplet belønner dine kunder, hver
            gang de vælger dig igen.
          </p>
        </div>
        <div className="mt-12 md:mt-0">
          <AnimatedStampScene />
        </div>
      </div>
      <StepTabs />
    </Section>
  );
}
