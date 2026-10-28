"use client";

import { useEffect, useRef, useState } from "react";

// Koerer en scenes CSS-loop kun, mens den er paa skaermen (data-play), saa siden
// ikke bruger batteri paa animationer, ingen ser. Starter pauset paa serveren.
export function Play({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [play, setPlay] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setPlay(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setPlay(e?.isIntersecting ?? false), { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-play={play ? "true" : "false"} className={`hv-scene ${className ?? ""}`}>
      {children}
    </div>
  );
}
