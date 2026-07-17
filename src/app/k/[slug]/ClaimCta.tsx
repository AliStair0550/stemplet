"use client";

import { useSearchParams } from "next/navigation";

// Naar claimCard afviser en oprettelse, sender den kunden tilbage til
// /k/[slug]?fejl=... Det sker enten fordi butikkens kort er slaaet fra imens
// (lukket), eller fordi et evt. kunde-loft er naaet (fuld). Selve /k-siden er
// statisk (ISR), saa vi laeser fejlen paa klienten og viser en klar besked i
// stedet for den ellers uforklarede "Hent"-knap, der bare sendte kunden rundt i
// ring. Uden fejl vises den normale knap (children).
const MESSAGES: Record<string, string> = {
  lukket: "Stempelkortet er ikke aktivt lige nu. Spørg personalet i butikken.",
  fuld: "Butikken kan ikke tage imod flere stempelkort lige nu. Spørg personalet.",
  pause: "Butikken tager ikke imod nye stempelkort lige nu. Spørg personalet.",
  stoppet: "Stempelkortet er sat på pause lige nu. Spørg personalet i butikken.",
};

export function ClaimCta({ children }: { children: React.ReactNode }) {
  const fejl = useSearchParams().get("fejl");
  const message = fejl ? MESSAGES[fejl] : null;
  if (message) {
    return (
      <p
        role="status"
        className="w-full rounded-lg border border-rust/30 bg-rust/5 px-5 py-4 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
      >
        {message}
      </p>
    );
  }
  return <>{children}</>;
}
