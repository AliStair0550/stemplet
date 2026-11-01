"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Confetti } from "@/components/Celebrate";
import { WalletIcon } from "@/components/ui";
import { dismissOnboardingAction } from "./actions";
import { ShareCardButton } from "./ShareCardButton";

// Kom i gang er klaret: et flueben, der popper frem, konfetti (kun foerste gang
// paa denne enhed) og den ene ting, der er tilbage: den foerste kunde.
export function GuideDone({
  businessId,
  share,
}: {
  businessId: string;
  share: { businessName: string; url: string; text: string; shared: boolean; walletEnabled: boolean };
}) {
  const [party, setParty] = useState(false);

  useEffect(() => {
    const key = `folka-guide-faerdig-${businessId}`;
    try {
      if (window.localStorage.getItem(key)) return;
      window.localStorage.setItem(key, "1");
    } catch {
      // Privat browsing: fejr bare hver gang.
    }
    setParty(true);
  }, [businessId]);

  return (
    <section
      aria-labelledby="kom-i-gang"
      className="relative mb-10 overflow-hidden rounded-[22px] bg-[#061C3D] px-5 pb-6 pt-8 text-center text-white md:px-8 md:pb-8 md:pt-10"
    >
      {party ? <Confetti colors={["#7CC4FF", "#FFFFFF", "#F2C14E", "#E8F0FB"]} originY="30%" /> : null}
      {/* Bloedt lys bag fluebenet. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-[28rem] -translate-x-1/2 rounded-full bg-[#7CC4FF]/20 blur-3xl"
      />
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <span aria-hidden className="absolute inset-0 rounded-full border-2 border-[#7CC4FF]/60 [animation:presencePulse_2.4s_ease-out_infinite]" />
        <span aria-hidden className="absolute inset-0 rounded-full border-2 border-[#7CC4FF]/60 [animation:presencePulse_2.4s_ease-out_infinite] [animation-delay:1.2s]" />
        <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#7CC4FF] text-[#061C3D] shadow-[0_10px_30px_-8px_rgba(124,196,255,0.7)] [animation:stampPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </span>
      </div>

      <h2 id="kom-i-gang" className="relative mt-5 text-[1.7rem] font-bold leading-tight tracking-[-0.03em]">
        Dit kort er klar
      </h2>
      <p className="relative mx-auto mt-2 max-w-[22rem] text-[0.98rem] leading-relaxed text-white/75">
        Alt er sat op. Nu mangler bare den første kunde: vis QR-koden ved kassen i dag.
      </p>

      <div className="relative mt-6 flex flex-col items-center gap-2.5">
        {share.walletEnabled ? (
          <a
            href="/api/wallet/butikkort"
            className="inline-flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-black px-5 text-[0.92rem] font-semibold text-white ring-1 ring-inset ring-white/25"
          >
            <WalletIcon />
            QR-koden i din Wallet
          </a>
        ) : null}
        <span className="flex flex-wrap justify-center gap-2">
          <ShareCardButton businessName={share.businessName} url={share.url} text={share.text} shared={share.shared} tone="light" />
          <Link
            href="/app/regler?f=kundekort&vis=1"
            className="inline-flex min-h-10 items-center rounded-full px-4 text-[0.85rem] font-semibold text-white ring-1 ring-inset ring-white/30 hover:bg-white/10"
          >
            Vis QR-kode
          </Link>
        </span>
        <form action={dismissOnboardingAction} className="mt-2">
          <button type="submit" className="min-h-10 px-3 text-[0.85rem] font-semibold text-white/60 underline-offset-4 hover:text-white hover:underline">
            Luk Kom i gang
          </button>
        </form>
      </div>
    </section>
  );
}
