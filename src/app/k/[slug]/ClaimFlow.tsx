"use client";

import { useState } from "react";
import { btnClass, CtaGlow, CTA_EMPHASIS, WalletIcon } from "@/components/ui";
import { Spinner } from "@/components/SubmitButton";
import { WalletAddedNotice } from "@/components/WalletAddedNotice";
import { claimCard } from "./actions";

// Fejl-koder fra claimCard oversat til en klar besked til kunden.
const ERRORS: Record<string, string> = {
  lukket: "Stempelkortet er ikke aktivt lige nu. Spørg personalet i butikken.",
  fuld: "Butikken kan ikke tage imod flere stempelkort lige nu. Spørg personalet.",
  pause: "Butikken tager ikke imod nye stempelkort lige nu. Spørg personalet.",
  stoppet: "Stempelkortet er sat på pause lige nu. Spørg personalet i butikken.",
};

// "Hent mit stempelkort"-flowet paa klienten. VIGTIGT om iPhone: en webside kan
// IKKE paalideligt aabne Apple Wallet automatisk EFTER et server-kald (bruger-
// gesten er tabt, og en tvungen window.location til .pkpass'et faar siden til at
// crashe -> "Prøv igen", selvom kortet reelt blev oprettet). Derfor: vi opretter
// kortet ved foerste tryk, og viser saa en RIGTIG "Læg i Apple Wallet"-knap (et
// <a>-link, som Safari selv aabner Wallet-arket fra, samme velafproevede moenster
// som paa webkortet). Naar kunden trykker paa den, aabner Wallet, og vi viser
// kvitteringen. Android/desktop (ingen Wallet) sendes til webkortet med QR.
export function ClaimFlow({
  slug,
  walletEnabled,
}: {
  slug: string;
  walletEnabled: boolean;
}) {
  const [state, setState] = useState<"idle" | "pending" | "ready" | "added">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [passUrl, setPassUrl] = useState<string | null>(null);

  async function onClaim() {
    setError(null);
    setState("pending");
    const res = await claimCard(slug).catch(() => null);
    if (!res) {
      setError("Noget gik galt. Prøv igen om et øjeblik.");
      setState("idle");
      return;
    }
    if (!res.ok) {
      setError(ERRORS[res.error] ?? "Noget gik galt. Prøv igen.");
      setState("idle");
      return;
    }

    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (ios && walletEnabled) {
      // iPhone: vis en rigtig Wallet-knap, som kunden selv trykker paa.
      setPassUrl(`/api/wallet/pass/${res.serial}`);
      setState("ready");
    } else {
      // Ingen Apple Wallet (Android/desktop): vis webkortet med QR-koden.
      window.location.href = `/kort/${res.serial}`;
    }
  }

  if (error) {
    return (
      <p
        role="status"
        className="w-full rounded-lg border border-rust/30 bg-rust/5 px-5 py-4 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
      >
        {error}
      </p>
    );
  }

  if (state === "added") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <WalletAddedNotice />
        {passUrl ? (
          <a
            href={passUrl}
            className="inline-flex items-center gap-2 text-[0.8rem] font-[300] text-terracotta underline underline-offset-2 hover:opacity-70"
          >
            <WalletIcon className="h-4 w-4" />
            Åbn kortet i Apple Wallet igen
          </a>
        ) : null}
      </div>
    );
  }

  if (state === "ready" && passUrl) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <CtaGlow className="w-full">
          <a
            href={passUrl}
            onClick={() => setState("added")}
            className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
          >
            <WalletIcon />
            Læg i Apple Wallet
          </a>
        </CtaGlow>
        <p className="text-center text-[0.82rem] font-[300] leading-relaxed text-stone">
          Dit kort er klar. Tryk for at lægge det i din Apple Wallet.
        </p>
      </div>
    );
  }

  // idle / pending
  return (
    <CtaGlow className="w-full">
      <button
        type="button"
        onClick={onClaim}
        disabled={state === "pending"}
        aria-busy={state === "pending"}
        className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
      >
        {state === "pending" ? (
          <>
            <Spinner />
            Opretter dit kort...
          </>
        ) : (
          "Hent mit stempelkort"
        )}
      </button>
    </CtaGlow>
  );
}
