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
  const [display, setDisplay] = useState(value);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
      else setDisplay(value);
    };
    setDisplay(0);
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  return <span>{formatValue(display, format, suffix, decimals)}</span>;
}
