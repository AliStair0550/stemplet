"use client";

import { useState } from "react";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";

// Interaktivt "proev et stempel": klik og se stemplet poppe ind, praecis som paa
// kundens telefon. En bloed gloed bag kortet + sheen giver det et magisk skaer,
// og naar kortet fyldes, gloder beloenningen. Bordeaux-tema (Vinbaren), saa det
// er et andet eksempel end resten af sitet.
export function StampDemo() {
  const required = 10;
  const [stamps, setStamps] = useState(3);
  const done = stamps >= required;

  return (
    <div className="flex flex-col items-center gap-7">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 rounded-[48px] bg-[#5E2438]/25 blur-[70px]"
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

      <div className="flex flex-wrap items-center justify-center gap-2.5">
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
        className="min-h-[1.25rem] text-center text-[0.9rem] font-[400] text-terracotta transition-opacity"
        aria-live="polite"
      >
        {done ? "Belønningen er klar. Sådan bliver en gæst til en stamkunde." : ""}
      </p>
    </div>
  );
}
