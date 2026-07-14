"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Lille kasse-scene: en haand giver et stempelkort, og stemplerne lander eet
// efter eet i en loop. Illustrerer "kortet ligger altid i kundens Wallet, og
// hvert besoeg tikker ind". Loopet starter naar scenen ses, og pauser udenfor.
const DOTS = 10;
const COLS = 5;

function CheckGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// En lille stylet haand, der raekker kortet frem nedefra.
function HandGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 40" fill="none" className={className}>
      <path
        d="M6 39c2-9 8-13 15-13h9c3 0 5-1 5-3s-2-3-5-3h-9c-2 0-3-1-3-2 0-2 2-3 5-3h14c4 0 7 2 7 6 0 8-7 14-16 14H6Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

export function StatsScene() {
  const [filled, setFilled] = useState(0);
  const [press, setPress] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setFilled(DOTS);
      return;
    }
    const node = ref.current;
    if (!node) return;

    let alive = true;
    let visible = false;
    let running = false;
    const timers: number[] = [];
    const wait = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        if (alive) fn();
      }, ms);
      timers.push(id);
    };

    const cycle = () => {
      if (!alive) return;
      running = true;
      setFilled(0);
      const step = (n: number) => {
        setFilled(n);
        setPress(true);
        wait(() => setPress(false), 150);
        if (n < DOTS) {
          wait(() => step(n + 1), 300);
        } else if (visible) {
          wait(cycle, 2200);
        } else {
          running = false;
        }
      };
      wait(() => step(1), 500);
    };

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible && !running) cycle();
      },
      { threshold: 0.3 },
    );
    io.observe(node);

    return () => {
      alive = false;
      io.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div ref={ref} className="relative flex items-end justify-center">
      {/* Kortet der stemples */}
      <div
        className={cn(
          "relative z-10 rounded-2xl bg-parchment/95 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/10 transition-transform duration-150",
          press ? "-translate-y-0.5" : "translate-y-0",
        )}
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[0.6rem] font-[500] uppercase tracking-[0.14em] text-moss">
            Stempelkort
          </span>
          <span className="text-[0.62rem] font-[400] tabular-nums text-stone">
            {Math.min(filled, DOTS)}/{DOTS}
          </span>
        </div>
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: DOTS }).map((_, i) => {
            const on = i < filled;
            const justLanded = press && i === filled - 1;
            return (
              <span
                key={i}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
                  on
                    ? "bg-moss text-white shadow-[0_3px_8px_rgba(45,95,74,0.4)]"
                    : "bg-ink/[0.06] text-transparent",
                  justLanded && "animate-stamp-pop",
                )}
              >
                <CheckGlyph />
              </span>
            );
          })}
        </div>
      </div>

      {/* Haanden, der raekker kortet frem */}
      <HandGlyph className="absolute -bottom-3 left-1/2 h-16 w-16 -translate-x-[130%] text-moss-light/80" />
    </div>
  );
}
