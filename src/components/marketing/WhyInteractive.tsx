"use client";

import { useState } from "react";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";

// Interaktivt "proev et stempel": klik og se stemplet poppe ind, praecis som paa
// kundens telefon. Naar kortet fyldes, gloder beloenningen.
export function StampDemo() {
  const required = 10;
  const [stamps, setStamps] = useState(3);
  const done = stamps >= required;

  return (
    <div className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
      <div className="order-2 flex flex-col items-center gap-5 md:order-1 md:items-start">
        <p className="text-center text-[0.95rem] leading-[1.7] text-taupe md:text-left">
          Klik og se, hvordan et stempel lander på kundens kort. Det samme sker
          på deres telefon, med det samme.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
          <button
            type="button"
            onClick={() => setStamps((s) => Math.min(required, s + 1))}
            disabled={done}
            className={`${btnClass("primary")} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {done ? "Kortet er fuldt" : "Giv et stempel"}
          </button>
          <button
            type="button"
            onClick={() => setStamps(0)}
            className={btnClass("outline")}
          >
            Nulstil
          </button>
        </div>
        <p
          className="min-h-[1.25rem] text-[0.85rem] font-[400] text-terracotta transition-opacity"
          aria-live="polite"
        >
          {done
            ? "Belønningen er klar. Det er sådan, en stamkunde bliver til."
            : ""}
        </p>
      </div>

      <div className="order-1 flex justify-center md:order-2">
        <StampCard
          businessName="Coffee Lab"
          primaryColor="#2A1A10"
          textColor="#F6EEE4"
          stampIcon="coffee"
          stamps={stamps}
          required={required}
          rewardText="10. kop er gratis"
          pop
          shine
          serial="STEMPLET01"
          serialLabel="Coffee Lab"
          className="max-w-[20rem]"
        />
      </div>
    </div>
  );
}

// Del siden: native share paa mobil, kopier-link som fallback paa desktop.
export function SharePage({ url, label = "Del siden" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title: "Derfor Stemplet",
      text: "Se hvorfor din forretning skal vælge Stemplet.",
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* udklipsholder ikke tilgaengelig */
    }
  }

  return (
    <button type="button" onClick={share} className={btnClass("outline", "lg")}>
      {copied ? "Kopieret" : label}
    </button>
  );
}
