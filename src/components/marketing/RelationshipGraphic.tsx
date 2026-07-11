"use client";

// Relations-visuelt: stempelkortet i centrum, forbundet til kunder, der kommer
// igen. Glødende linjer flyder ind mod midten, og selve kortet fyldes stempel
// for stempel - naar det sidste lander, fejres det, og runden starter forfra.
// Ren CSS + let state. Reduceret bevægelse respekteres.
import { useEffect, useRef, useState } from "react";

const NODES = [
  { x: 50, y: 11, d: 0 },
  { x: 87, y: 37, d: 0.6 },
  { x: 73, y: 83, d: 1.1 },
  { x: 27, y: 83, d: 0.3 },
  { x: 13, y: 37, d: 0.85 },
];

const TOTAL = 6;

function PersonGlyph() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-moss">
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M4.6 20c0-4 3.3-6.6 7.4-6.6s7.4 2.6 7.4 6.6z" />
    </svg>
  );
}

export function RelationshipGraphic() {
  const [filled, setFilled] = useState(2);
  const [celebrate, setCelebrate] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const started = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) {
      setFilled(TOTAL);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const timers: number[] = [];
    let cancelled = false;

    function runCycle() {
      setCelebrate(false);
      setFilled(0);
      let delay = 640;
      for (let value = 1; value <= TOTAL; value++) {
        const target = value;
        timers.push(
          window.setTimeout(() => {
            if (cancelled) return;
            setFilled(target);
            if (target === TOTAL) {
              setCelebrate(true);
              // Fejr - hold et øjeblik - og start forfra.
              timers.push(
                window.setTimeout(() => {
                  if (!cancelled) runCycle();
                }, 2200),
              );
            }
          }, delay),
        );
        delay += 600;
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          runCycle();
          observer.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);

    return () => {
      cancelled = true;
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-square w-full max-w-[21rem]"
    >
      {/* Blødt baggrundsskær */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-2/3 w-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/12 blur-3xl"
      />

      {/* Forbindelser (glødende linjer, der flyder ind mod midten) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <radialGradient
            id="relLine"
            gradientUnits="userSpaceOnUse"
            cx="50"
            cy="50"
            r="42"
          >
            <stop offset="0%" stopColor="#2D5F4A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#2D5F4A" stopOpacity="0.08" />
          </radialGradient>
        </defs>

        {NODES.map((n, i) => (
          <line
            key={i}
            x1={50}
            y1={50}
            x2={n.x}
            y2={n.y}
            stroke="url(#relLine)"
            strokeWidth={0.9}
            strokeLinecap="round"
            strokeDasharray="2 5"
            style={{
              animation: "dashFlow 1.5s linear infinite",
              animationDelay: `${n.d}s`,
            }}
          />
        ))}
      </svg>

      {/* Kunde-noder (mennesker, der kommer igen) */}
      {NODES.map((n, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
        >
          <div className="animate-float" style={{ animationDelay: `${n.d}s` }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-parchment shadow-[0_5px_16px_-5px_rgba(26,26,26,0.35)] ring-1 ring-moss/25">
              <PersonGlyph />
            </div>
          </div>
        </div>
      ))}

      {/* Centrum: selve stempelkortet, som relationen bygges omkring */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span
          aria-hidden
          className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/18 blur-lg"
        />
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out infinite" }}
        />
        <span
          className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-moss/25"
          style={{ animation: "presencePulse 3s ease-out 1.5s infinite" }}
        />

        {/* Dopamin-ring, naar kortet fyldes helt */}
        {celebrate ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-moss"
            style={{ animation: "burstRing 0.75s ease-out forwards" }}
          />
        ) : null}

        <div
          className={
            "relative flex flex-col gap-1.5 rounded-md px-3 py-2.5 shadow-[0_14px_34px_-8px_rgba(26,26,26,0.55)] ring-1 ring-black/10 transition-transform duration-500" +
            (celebrate ? " animate-[cardBurst_0.55s_ease-out]" : "")
          }
          style={{
            background: "#2A1A10",
            color: "#F6EEE4",
            transform: "rotate(-4deg)",
          }}
        >
          <span
            className="text-[0.44rem] font-[500] uppercase tracking-[0.12em]"
            style={{ color: "rgba(246,238,228,0.7)" }}
          >
            Coffee Lab
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const isFilled = i < filled;
              const justFilled = i === filled - 1;
              return (
                <span
                  key={`${i}-${isFilled}`}
                  className={
                    "h-2.5 w-2.5 rounded-full" +
                    (isFilled && justFilled ? " animate-stamp-pop" : "") +
                    (celebrate ? " animate-reward-glow" : "")
                  }
                  style={
                    isFilled
                      ? {
                          background: "#F6EEE4",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                        }
                      : { border: "1px solid rgba(246,238,228,0.35)" }
                  }
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
