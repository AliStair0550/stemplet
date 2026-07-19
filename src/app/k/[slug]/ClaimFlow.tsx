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

// Hele "Hent mit stempelkort"-flowet paa klienten, saa vi kan aabne Apple Wallet
// DIREKTE paa iPhone (ingen mellemside med QR) og bagefter vise kvitteringen paa
// samme side. claimCard opretter kortet og returnerer serienummeret; herfra
// bestemmer vi selv, hvad der sker.
export function ClaimFlow({
  slug,
  walletEnabled,
}: {
  slug: string;
  walletEnabled: boolean;
}) {
  const [state, setState] = useState<"idle" | "pending" | "added">("idle");
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
      // iPhone: aabn Apple Wallet direkte med kortet, og vis kvitteringen paa
      // denne side. En pkpass-hentning skifter ikke side, saa "added"-visningen
      // bliver staaende under Wallet-arket.
      const url = `/api/wallet/pass/${res.serial}`;
      setPassUrl(url);
      setState("added");
      window.location.href = url;
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
            Åbnede Wallet ikke? Læg i Apple Wallet
          </a>
        ) : null}
      </div>
    );
  }

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
