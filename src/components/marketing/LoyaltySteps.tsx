import { Section } from "@/components/ui";
import { StepTabs } from "./StepTabs";

// "Loyalitet gjort enkelt": de fire trin pr. rolle (kunde, medarbejder, ejer).
// Egen sektion med lys baggrund (ingen tint), saa den staar i tydelig kontrast
// til "Faa flere stamkunder" ovenfor.
export default function LoyaltySteps() {
  return (
    <Section>
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.7rem]">
          Loyalitet gjort enkelt.
        </h2>
      </div>
      <StepTabs />
    </Section>
  );
}
