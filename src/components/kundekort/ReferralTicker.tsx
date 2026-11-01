"use client";

import { useEffect, useState } from "react";

// Henvisninger i tre takter: Karoline deler, Louise bliver kunde, Karoline faar
// sin beloenning, og butikken faar en ny stamkunde. Skifter af sig selv; uden
// bevaegelse (reduced motion) staar den foerste saetning stille.
const STEPS: [string, string, string][] = [
  ["Karoline", "giver", "Louise 100 kr. rabat"],
  ["Louise", "sparer", "100 kr. første gang"],
  ["Karoline", "får", "et gratis klip"],
  ["Du", "får", "en ny stamkunde"],
];

export function ReferralTicker() {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % STEPS.length), 2600);
    return () => window.clearInterval(t);
  }, []);

  const [who, verb, what] = STEPS[i]!;
  return (
    <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2" aria-hidden>
      <span key={`a${i}`} className="kk-tick rounded-full bg-[#061C3D] px-4 py-2 text-[14px] font-semibold text-white">
        {who}
      </span>
      <span key={`b${i}`} className="kk-tick text-[14px] text-[#8D98A8]" style={{ animationDelay: "60ms" }}>
        {verb}
      </span>
      <span
        key={`c${i}`}
        className="kk-tick rounded-full bg-[#E8F0FB] px-4 py-2 text-[14px] font-semibold text-[#1B5EAE]"
        style={{ animationDelay: "120ms" }}
      >
        {what}
      </span>
    </div>
  );
}
