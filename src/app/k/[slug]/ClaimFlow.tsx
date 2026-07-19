"use client";

import { useEffect, useState } from "react";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { WalletAddedNotice } from "@/components/WalletAddedNotice";

// Fejl-koder (fra claim-ruten via ?fejl=) oversat til en klar besked.
const ERRORS: Record<string, string> = {
  lukket: "Stempelkortet er ikke aktivt lige nu. Spørg personalet i butikken.",
  fuld: "Butikken kan ikke tage imod flere stempelkort lige nu. Spørg personalet.",
  pause: "Butikken tager ikke imod nye stempelkort lige nu. Spørg personalet.",
  stoppet: "Stempelkortet er sat på pause lige nu. Spørg personalet i butikken.",
};

// "Hent mit stempelkort" er et RIGTIGT link til /api/wallet/claim/[slug]. Ruten
// opretter kortet og returnerer .pkpass'et i samme svar, saa Safari aabner Apple
// Wallet-arket direkte fra kundens eget tryk (eet tryk paa web, saa "Tilføj" i
// arket). Ingen skroebelig JavaScript-navigation, saa ingen "Prøv igen"-crash.
// Paa iPhone bliver siden liggende bag arket, saa vi viser kvitteringen der.
// Android/desktop sendes af ruten videre til webkortet med QR.
export function ClaimFlow({
  slug,
  walletEnabled,
}: {
  slug: string;
  walletEnabled: boolean;
}) {
  const [added, setAdded] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const claimUrl = `/api/wallet/claim/${slug}`;

  // Læs en evt. ?fejl=... paa klienten, saa /k-siden kan forblive statisk (ISR).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("fejl");
    if (code && ERRORS[code]) setFejl(code);
  }, []);

  if (fejl) {
    return (
      <p
        role="status"
        className="w-full rounded-lg border border-rust/30 bg-rust/5 px-5 py-4 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
      >
        {ERRORS[fejl]}
      </p>
    );
  }

  if (added) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <WalletAddedNotice />
        <a
          href={claimUrl}
          className="text-[0.8rem] font-[300] text-terracotta underline underline-offset-2 hover:opacity-70"
        >
          Åbn kortet i Apple Wallet igen
        </a>
      </div>
    );
  }

  function onTap() {
    // iPhone: passet aabnes i Wallet-arket, og siden bliver liggende, saa vi
    // viser kvitteringen. Android/desktop sendes videre af ruten (ingen kvittering
    // her), saa der roerer vi ikke tilstanden.
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (ios && walletEnabled) setAdded(true);
  }

  return (
    <CtaGlow className="w-full">
      <a
        href={claimUrl}
        onClick={onTap}
        className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
      >
        Hent mit stempelkort
      </a>
    </CtaGlow>
  );
}
