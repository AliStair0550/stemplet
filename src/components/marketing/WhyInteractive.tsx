"use client";

import { useState } from "react";
import { StampCard } from "@/components/StampCard";
import { Celebration } from "@/components/Celebration";
import { btnClass } from "@/components/ui";

// Interaktivt "proev et stempel": klik og se stemplet poppe ind, praecis som paa
// kundens telefon. En bloed gloed bag kortet + sheen giver det et magisk skaer.
// Naar kortet bliver fuldt, udloeses en dopamin-fejring (konfetti + gloedende
// gave), hvorefter kortet nulstiller sig selv, saa man kan proeve igen.
// Bordeaux-tema (Vinbaren), saa det er et andet eksempel end resten af sitet.
export function StampDemo() {
  const required = 10;
  const [stamps, setStamps] = useState(3);
  const [celebrating, setCelebrating] = useState(false);

  function giveStamp() {
    if (celebrating) return;
    const next = Math.min(required, stamps + 1);
    setStamps(next);
    if (next >= required) {
      setCelebrating(true);
      window.setTimeout(() => {
        setCelebrating(false);
        setStamps(0);
      }, 2600);
    }
  }

  const full = stamps >= required;

  return (
    <div className="flex flex-col items-center gap-7">
      <Celebration show={celebrating} />

      <div className="relative">
        <div
          aria-hidden
          className={`pointer-events-none absolute -inset-8 rounded-[48px] blur-[70px] transition-all duration-500 ${
            celebrating ? "bg-[#C9A24B]/40 scale-110" : "bg-[#5E2438]/25"
          }`}
        />
        <div className="relative">
          <StampCard
            businessName="Vinbaren"
            primaryColor="#5E2438"
            textColor="#F7E7EE"
            stampIcon="wine"
            stamps={stamps}
            required={required}
            rewardText="10. glas er gratis"
            pop
            shine
            serial="STEMPLET01"
            serialLabel="Vinbaren"
            className="max-w-[20rem]"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={giveStamp}
        disabled={full}
        className={`${btnClass("primary")} disabled:cursor-not-allowed disabled:opacity-70`}
      >
        {full ? "Belønning låst op" : "Giv et stempel"}
      </button>

      <p
        className="min-h-[1.25rem] text-center text-[0.9rem] font-[400] text-terracotta transition-opacity"
        aria-live="polite"
      >
        {celebrating
          ? "Belønningen er klar. Sådan bliver en gæst til en stamkunde."
          : ""}
      </p>
    </div>
  );
}
