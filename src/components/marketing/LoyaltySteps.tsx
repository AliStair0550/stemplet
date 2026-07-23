import { Section } from "@/components/ui";
import { StepTabs } from "./StepTabs";
import AnimatedStampScene from "./AnimatedStampScene";

// "Loyalitet gjort enkelt": titel + undertekst, de fire trin pr. rolle (fanerne),
// og nederst den animerede demo (eet kort fra scan til fast gaest). Lys baggrund,
// saa den staar i tydelig kontrast til sektionen ovenfor.
export default function LoyaltySteps() {
  return (
    <Section id="sådan" className="scroll-mt-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.7rem]">
          Loyalitet gjort enkelt.
        </h2>
        <p className="mx-auto mt-5 max-w-xl font-[300] text-[1rem] leading-[1.7] text-stone">
          Få flere stamkunder. Fra første scan til fast gæst. Motiver kunderne
          til at komme igen med digitale stempler og eksklusive fordele.
        </p>
      </div>
      <StepTabs />
      <AnimatedStampScene />
    </Section>
  );
}
