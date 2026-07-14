"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Lille statistik-widget: en stigende genbesoegs-graf, hvor soejlerne vokser op
// eet efter eet og procenten taeller op. Fortaeller "du kan se, hvem der kommer
// igen" - noget papkortet aldrig kunne. Loop starter naar den ses, pauser
// udenfor skaerm, og respekterer reduceret bevaegelse.
const BARS = [34, 44, 39, 56, 62, 74, 92]; // stigende trend (procent-hoejder)
const PEAK = 68; // "vender tilbage" - taeller op til dette

export function StatsScene() {
  const [grown, setGrown] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setGrown(BARS.length);
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
      setGrown(0);
      const step = (n: number) => {
        setGrown(n);
        if (n < BARS.length) {
          wait(() => step(n + 1), 200);
        } else if (visible) {
          wait(cycle, 2000);
        } else {
          running = false;
        }
      };
      wait(() => step(1), 450);
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

  const pct = Math.round((PEAK * grown) / BARS.length);

  return (
    <div
      ref={ref}
      className="w-[15.5rem] rounded-2xl bg-parchment/95 p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-black/10"
    >
      <div className="flex items-start justify-between">
        <div>
          <span className="text-[0.58rem] font-[500] uppercase tracking-[0.14em] text-moss">
            Genbesøg
          </span>
          <div className="mt-1 font-fraunces text-[2rem] font-light leading-none tabular-nums text-ink">
            {pct}%
          </div>
          <span className="text-[0.62rem] font-[300] text-stone">
            vender tilbage
          </span>
        </div>
        <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-moss/10 px-2 py-1 text-[0.6rem] font-[500] text-moss">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3 w-3"
          >
            <path d="M4 17 10 11l4 4 6-7M15 5h5v5" />
          </svg>
          op
        </span>
      </div>

      {/* Soejle-graf: vokser op eet felt ad gangen */}
      <div className="mt-5 flex h-24 items-end gap-1.5">
        {BARS.map((h, i) => {
          const on = i < grown;
          const isPeak = i === BARS.length - 1;
          return (
            <div
              key={i}
              className={cn(
                "flex-1 origin-bottom rounded-t-[3px] transition-all duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                isPeak ? "bg-[#C9A24B]" : "bg-moss",
              )}
              style={{ height: on ? `${h}%` : "4%", opacity: on ? 1 : 0.25 }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[0.55rem] font-[300] uppercase tracking-[0.08em] text-slate">
        <span>Man</span>
        <span>Søn</span>
      </div>
    </div>
  );
}
