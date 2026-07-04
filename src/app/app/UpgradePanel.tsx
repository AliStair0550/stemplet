import { startCheckout } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PRO_PRICE_DKK } from "@/lib/plans";

export function UpgradePanel({ feature }: { feature: string }) {
  return (
    <div className="rounded-sm border border-moss bg-moss/5 p-8 text-center">
      <h3 className="font-[300] text-[1.2rem] text-ink">
        {feature} er en del af Pro
      </h3>
      <p className="mx-auto mt-2 max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
        Få ubegrænset kort, kampagner og fuld statistik for {PRO_PRICE_DKK}{" "}
        kr./md. Mindre end een genkøbt kunde om måneden.
      </p>
      <form action={startCheckout} className="mt-5 flex justify-center">
        <SubmitButton variant="moss" size="lg" pendingText="Åbner Stripe...">
          Opgrader til Pro
        </SubmitButton>
      </form>
      <p className="mt-3 text-[0.72rem] font-[200] text-slate">
        Ingen binding. Skift plan når som helst.
      </p>
    </div>
  );
}
