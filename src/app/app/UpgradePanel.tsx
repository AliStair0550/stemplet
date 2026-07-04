import { startCheckout } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PRO_PRICE_DKK } from "@/lib/plans";

export function UpgradePanel({ feature }: { feature: string }) {
  return (
    <div className="rounded-xl border border-moss bg-moss/5 p-8 text-center">
      <h3 className="font-[300] text-[1.2rem] text-ink">
        {feature} er en del af Pro
      </h3>
      <p className="mx-auto mt-2 max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
        Faa ubegraenset kort, kampagner og fuld statistik for {PRO_PRICE_DKK}{" "}
        kr./md. Mindre end een genkoebt kunde om maaneden.
      </p>
      <form action={startCheckout} className="mt-5 flex justify-center">
        <SubmitButton variant="moss" size="lg" pendingText="Aabner Stripe...">
          Opgrader til Pro
        </SubmitButton>
      </form>
      <p className="mt-3 text-[0.72rem] font-[200] text-slate">
        Ingen binding. Skift plan naar som helst.
      </p>
    </div>
  );
}
