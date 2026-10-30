import type { Metadata } from "next";
import Link from "next/link";
import { loadDemoBusiness, DEMO_SLUG } from "@/lib/demo";
import QRCode from "qrcode";
import { APP_URL, WALLET_ENABLED } from "@/lib/env";
import { DemoExperience } from "./DemoExperience";

export const metadata: Metadata = {
  title: "Prøv Folka Kort på din telefon",
  description:
    "Læg et rigtigt digitalt stempelkort i din Apple Wallet på få sekunder. Ingen app. Præcis som dine kunder vil opleve det.",
  robots: { index: false },
};
// Statisk skal (branding + layout bages ind ved build) = hurtig foerste load.
// Selve kort-tilstanden hentes klient-side, saa den er altid frisk.
export const revalidate = 3600;

export default async function ProevPage() {
  const biz = await loadDemoBusiness();
  const card = biz?.cards[0] ?? null;
  // Paa en computer kan kortet ikke laegges i Wallet: vis en kode til telefonen.
  const qrDataUrl = await QRCode.toDataURL(`${APP_URL}/pr%C3%B8v`, { margin: 1, width: 360, color: { dark: "#061C3D", light: "#FFFFFF" } });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F2F5F9] px-6 py-8 text-center text-[#061C3D]">
      <h1 className="max-w-md text-[2rem] font-semibold leading-[1.05] tracking-[-0.035em]">Prøv kortet på din egen telefon.</h1>

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
          qrDataUrl={qrDataUrl}
        />
      ) : (
        <p className="max-w-xs text-[0.95rem] text-[#5F6B7E]">
          Demoen er lige nu ikke tilgængelig. Prøv igen om lidt.
        </p>
      )}

      <div className="flex flex-col items-center gap-2">
        <Link
          href="/start"
          className="rounded-full bg-[#061C3D] px-7 py-3.5 text-[15px] font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          Opret dit eget kort
        </Link>
        <p className="text-[13px] text-[#5F6B7E]">Tre måneder gratis. Det tager et minut.</p>
      </div>
      <Link href="/" className="text-[13px] text-[#5F6B7E] underline-offset-4 hover:underline">
        Tilbage til forsiden
      </Link>
    </main>
  );
}
