import type { Metadata } from "next";
import Link from "next/link";
import { loadDemoBusiness, DEMO_SLUG } from "@/lib/demo";
import { WALLET_ENABLED } from "@/lib/env";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Prøv Stemplet i din egen Wallet",
  description:
    "Læg et rigtigt digitalt stempelkort i din Apple Wallet på fem sekunder. Ingen app, ingen tilmelding. Præcis som dine kunder vil opleve det.",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function ProevPage() {
  const biz = await loadDemoBusiness();
  const card = biz?.cards[0] ?? null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-9 bg-parchment px-6 py-14 text-center">
      <div className="flex max-w-md flex-col items-center gap-3">
        <span className="text-[0.62rem] font-[500] uppercase tracking-[0.18em] text-moss">
          Prøv det selv
        </span>
        <h1 className="font-fraunces text-[1.9rem] font-light italic leading-tight text-ink">
          Dit eget stempelkort. Lige nu.
        </h1>
        <p className="font-[300] text-[0.92rem] leading-relaxed text-stone">
          Læg kortet i din Apple Wallet på fem sekunder, og giv dig selv et
          stempel. Se det opdatere live. Præcis som dine kunder vil opleve det.
        </p>
      </div>

      {biz && card ? (
        <DemoExperience
          slug={DEMO_SLUG}
          businessName={biz.name}
          logoUrl={biz.logoUrl}
          primaryColor={biz.primaryColor}
          textColor={biz.textColor}
          stampIcon={card.stampIcon}
          rewardText={card.rewardText}
          required={card.stampsRequired}
          walletEnabled={WALLET_ENABLED}
        />
      ) : (
        <p className="max-w-xs font-[300] text-[0.95rem] text-stone">
          Demoen er lige nu ikke tilgængelig. Prøv igen om lidt.
        </p>
      )}

      <Link
        href="/"
        className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
      >
        Tilbage til forsiden
      </Link>
    </main>
  );
}
