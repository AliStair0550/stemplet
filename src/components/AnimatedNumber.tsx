"use client";

import { useEffect, useRef, useState } from "react";

// Tal der tæller op ved indlæsning. En lille dopamin-detalje. Respekterer
// reduceret bevægelse (viser slutværdien med det samme).
export function AnimatedNumber({
  value,
  format,
  durationMs = 900,
}: {
  value: number;
  format?: (n: number) => string;
  durationMs?: number;
}) {
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

  const fmt =
    format ?? ((n: number) => new Intl.NumberFormat("da-DK").format(Math.round(n)));
  return <span>{fmt(display)}</span>;
}
