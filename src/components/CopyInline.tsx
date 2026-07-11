"use client";

import { useState } from "react";

/** Lille kopiér-knap med link-tekst. Bruges til at dele kundens kort-link. */
export function CopyInline({ value, display }: { value: string; display: string }) {
  const [done, setDone] = useState(false);
  return (
    <span className="flex flex-wrap items-center gap-2">
      <code className="break-all text-[0.78rem] text-stone">{display}</code>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setDone(true);
            setTimeout(() => setDone(false), 1600);
          } catch {
            /* clipboard blokeret - ignorér */
          }
        }}
        className="shrink-0 border border-clay px-2 py-1 text-[0.62rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:border-moss hover:text-moss"
      >
        {done ? "Kopieret ✓" : "Kopiér"}
      </button>
    </span>
  );
}
