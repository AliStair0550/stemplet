"use client";

import { useEffect, useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";
import { Celebration } from "@/components/Celebration";
import { cn } from "@/lib/utils";

const REQUIRED = 10;
const START = 3;
const AUTO_TARGET = 7;

function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // haptik er valgfrit
  }
}

export default function HeroStampCard() {
  const [stamps, setStamps] = useState(START);
  const [pop, setPop] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
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
    if (stamps >= REQUIRED) {
      setStamps(0);
      setCelebrate(false);
      return;
    }
    const next = stamps + 1;
    setStamps(next);
    if (next >= REQUIRED) {
      setCelebrate(true);
      haptic([25, 40, 25, 40, 90]);
    } else {
      haptic(16);
    }
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <Celebration show={celebrate} />
      <div className="w-[28rem] max-w-full animate-float">
        <div
          ref={ref}
          role="button"
          tabIndex={0}
          aria-label="Copenhagen Coffee Lab stempelkort. Tryk for at stemple."
          onClick={handleTap}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTap();
            }
          }}
          className={cn(
            "relative w-full cursor-pointer rounded-[1.4rem] outline-none transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-moss/50",
            celebrate && "animate-[cardBurst_0.55s_ease-out]",
          )}
        >
          {celebrate ? (
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 -z-10 rounded-[1.7rem] ring-2 ring-moss"
              style={{ animation: "burstRing 0.7s ease-out forwards" }}
            />
          ) : null}
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
            serialLabel="Coffee Lab"
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
