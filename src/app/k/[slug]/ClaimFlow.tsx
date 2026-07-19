"use client";

import { useEffect, useState } from "react";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { Spinner } from "@/components/SubmitButton";
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
// Wallet-arket direkte fra kundens eget tryk. Ingen skroebelig JavaScript-
// navigation, saa ingen "Prøv igen"-crash.
//
// Raekkefoelge paa iPhone: tryk -> vi viser "Åbner Apple Wallet... tryk Tilføj"
// (saa kunden VED, at der skal trykkes Tilføj i arket). FOERST naar kunden vender
// TILBAGE fra arket (visibility bliver "visible" igen) - eller efter en faldback-
// forsinkelse - viser vi kvitteringen "Dit stempelkort er nu i din Wallet". Foer
// kom kvitteringen med det samme, endda foer arket, saa man kunne tro, at man
// ikke skulle goere noget. Android/desktop sendes af ruten videre til webkortet.
export function ClaimFlow({
  slug,
  walletEnabled,
}: {
  slug: string;
  walletEnabled: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "opening" | "added">("idle");
  const [fejl, setFejl] = useState<string | null>(null);
  const claimUrl = `/api/wallet/claim/${slug}`;

  // Læs en evt. ?fejl=... paa klienten, saa /k-siden kan forblive statisk (ISR).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("fejl");
    if (code && ERRORS[code]) setFejl(code);
  }, []);

  // Naar Wallet-arket er aabnet ("opening"), viser vi kvitteringen naar kunden
  // vender tilbage (visibility -> visible), ellers efter en faldback paa 4 sek.
  useEffect(() => {
    if (phase !== "opening") return;
    const finish = () => setPhase("added");
    const onVisible = () => {
      if (document.visibilityState === "visible") finish();
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setTimeout(finish, 4000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
    };
  }, [phase]);

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

  if (phase === "added") {
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

  if (phase === "opening") {
    return (
      <div className="flex w-full flex-col items-center gap-2 rounded-xl border border-fog bg-white p-5 text-center">
        <span className="inline-flex items-center gap-2 text-[0.92rem] font-[400] text-ink">
          <Spinner />
          Åbner Apple Wallet
        </span>
        <span className="text-[0.84rem] font-[300] leading-relaxed text-stone">
          Tryk <span className="font-[500] text-ink">Tilføj</span> i Apple Wallet
          for at gemme dit stempelkort.
        </span>
      </div>
    );
  }

  function onTap() {
    // iPhone: passet aabnes i Wallet-arket, og siden bliver liggende. Vi gaar i
    // "opening" og venter med kvitteringen til kunden kommer tilbage. Android/
    // desktop sendes videre af ruten (ingen kvittering her).
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (ios && walletEnabled) setPhase("opening");
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
