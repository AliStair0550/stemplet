"use client";

import { useEffect, useRef, useState } from "react";
import { StampIcon } from "@/components/StampIcon";

// Forsidens stempelkort i miniature: naar det kommer til syne, popper fem
// stempler ind et ad gangen, og det sjette (beloenningen) lyser op og pulserer.
// Uden bevaegelse (reduced motion) vises det fyldte kort med det samme.
export function LiveStamps() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid grid-cols-6 gap-2.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="relative grid aspect-square place-items-center rounded-full border-[1.5px] border-[#CAD2DD]">
          <span
            className="absolute inset-[-1.5px] grid place-items-center rounded-full bg-[#061C3D] text-white"
            style={on ? { animation: `stampPop 0.55s cubic-bezier(0.34,1.56,0.64,1) ${0.15 + i * 0.22}s both` } : { opacity: 0 }}
          >
            <StampIcon icon="coffee" className="h-[52%] w-[52%]" />
          </span>
        </span>
      ))}
      {/* Beloenningen: lyser op, naar kortet er fuldt, og bliver ved med at kalde. */}
      <span className="relative grid aspect-square place-items-center">
        {on ? (
          <span
            className="absolute inset-0 rounded-full border-2 border-[#1B5EAE]"
            style={{ animation: "stampRing 1.8s ease-out 1.5s infinite" }}
          />
        ) : null}
        <span
          className="grid h-full w-full place-items-center rounded-full transition-colors duration-500"
          style={
            on
              ? { background: "#1B5EAE", color: "#fff", animation: "stampPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 1.35s both, kk-gift 2.4s ease-in-out 2s infinite" }
              : { border: "1.5px dashed #CAD2DD", color: "#8D98A8" }
          }
        >
          <StampIcon icon="gift" className="h-[54%] w-[54%]" />
        </span>
      </span>
    </div>
  );
}
