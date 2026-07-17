import { startCheckout } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { PRO_PRICE_DKK } from "@/lib/plans";

export function UpgradePanel({
  feature,
  enabled = true,
}: {
  feature: string;
  enabled?: boolean;
}) {
  return (
    <div className="rounded-lg border border-terracotta bg-terracotta/5 p-8 text-center">
      <h3 className="font-[300] text-[1.2rem] text-ink">
        {feature} er en del af Pro
      </h3>
      <p className="mx-auto mt-2 max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
        Få ubegrænset kort, kampagner og fuld statistik for {PRO_PRICE_DKK}{" "}
        kr./md. Mindre end én genkøbt kunde om måneden.
      </p>
      {enabled ? (
        <form action={startCheckout} className="mt-5 flex justify-center">
          <SubmitButton variant="terracotta" size="lg" pendingText="Åbner Stripe...">
            Opgrader til Pro
          </SubmitButton>
        </form>
      ) : (
        <p className="mx-auto mt-5 max-w-sm text-[0.82rem] font-[200] leading-relaxed text-slate">
          Betaling er ikke sat op endnu. Alt andet virker på Gratis-planen. Sæt
          Stripe op, og så kan Pro aktiveres med det samme.
        </p>
      )}
      <p className="mt-3 text-[0.72rem] font-[200] text-slate">
        Ingen binding. Skift plan når som helst.
      </p>
    </div>
  );
}
