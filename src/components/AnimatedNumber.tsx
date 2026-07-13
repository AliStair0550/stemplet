"use client";

import { useEffect, useRef, useState } from "react";

// Tal der tæller op ved indlæsning. En lille dopamin-detalje. Respekterer
// reduceret bevægelse (viser slutværdien med det samme).
//
// VIGTIGT: props skal vaere serialiserbare (dette er en klient-komponent, der
// bruges fra server-komponenter). Send ALDRIG en funktion som prop - brug de
// faste format-muligheder her i stedet.
type Props = {
  value: number;
  /** "number" (standard) eller "percent" (runder og saetter %). */
  format?: "number" | "percent";
  /** Tekst efter tallet, fx " dage". */
  suffix?: string;
  /** Antal decimaler ved "number". Standard 0. */
  decimals?: number;
  durationMs?: number;
};

function formatValue(
  n: number,
  format: "number" | "percent",
  suffix: string,
  decimals: number,
): string {
  if (format === "percent") return `${Math.round(n)}%`;
  const num = new Intl.NumberFormat("da-DK", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(n);
  return `${num}${suffix}`;
}

export function AnimatedNumber({
  value,
  format = "number",
  suffix = "",
  decimals = 0,
  durationMs = 900,
}: Props) {
  // Starter paa 0 (baade paa serveren og ved hydrering, saa ingen mismatch) og
  // taeller op. Undgaar det tidligere blink hvor slutvaerdien kort blev vist,
  // sat til 0, og saa taalt op igen.
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    // Anim fra den nuvaerende visning (0 ved foerste mount, ellers forrige tal)
    // til den nye vaerdi, saa navigation glider blidt i stedet for at nulstille.
    const from = display;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (value - from) * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // display med vilje udeladt: skal kun anime naar maalvaerdien aendrer sig.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, durationMs]);

  return <span>{formatValue(display, format, suffix, decimals)}</span>;
}
