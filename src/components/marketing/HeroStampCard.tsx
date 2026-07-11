"use client";

import { useEffect, useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";

const REQUIRED = 10;
const START = 3;
const AUTO_TARGET = 7;

export default function HeroStampCard() {
  const [stamps, setStamps] = useState(START);
  const [pop, setPop] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const timeouts = useRef<number[]>([]);
  const started = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      setStamps(AUTO_TARGET);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          let delay = 320;
          for (let value = START + 1; value <= AUTO_TARGET; value++) {
            const target = value;
            const id = window.setTimeout(() => {
              setPop(true);
              setStamps(target);
            }, delay);
            timeouts.current.push(id);
            delay += 320;
          }
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      timeouts.current.forEach((id) => window.clearTimeout(id));
      timeouts.current = [];
    };
  }, []);

  function handleTap() {
    setPop(true);
    setStamps((s) => (s >= REQUIRED ? 0 : s + 1));
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="animate-float">
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          aria-label="Coffee Lab stempelkort. Tryk for at stemple."
          onClick={handleTap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTap();
            }
          }}
          className="cursor-pointer rounded-[1.4rem] outline-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-moss/50"
        >
          <StampCard
            businessName="Copenhagen Coffee Lab"
            logoUrl="/coffeelab.png"
            logoClassName="!h-9 opacity-90 [filter:brightness(0)_invert(1)]"
            hideName
            landscape
            primaryColor="#2A1A10"
            textColor="#F6EEE4"
            stampIcon="coffee"
            stamps={stamps}
            required={REQUIRED}
            rewardText="10. kop er gratis"
            serial="COFFEELAB1"
            showPoweredBy
            pop={pop}
            shine
          />
        </div>
      </div>
      <span className="font-[300] text-[0.72rem] uppercase tracking-[0.1em] text-slate">
        Tryk på kortet
      </span>
    </div>
  );
}
