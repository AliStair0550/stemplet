"use client";

import { useEffect, useMemo, useState } from "react";

// Lille fejring (Henvisninger): et konfetti-pust og et flueben, der tegnes. Kort
// (ca. 1 sek.), uden lyd, og kun konfetti for den, der ikke har slaaet animationer
// fra (prefers-reduced-motion skjuler .celebrate-confetti i globals.css).

// Fast pseudo-tilfaeldighed ud fra partiklens nummer (ren funktion, saa React
// kan rendere den; Math.random er ikke tilladt under render).
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Konfetti fra et punkt paa skaermen. Fjerner sig selv, naar pustet er ovre. */
export function Confetti({
  colors,
  count = 28,
  originY = "32%",
}: {
  colors: string[];
  count?: number;
  originY?: string;
}) {
  const [alive, setAlive] = useState(true);
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + rnd(i, 1) * 0.4;
        const dist = 90 + rnd(i, 2) * 130;
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist * 0.7 + 120 + rnd(i, 3) * 80,
          rot: rnd(i, 4) * 720 - 360,
          color: colors[i % colors.length],
          w: 6 + rnd(i, 5) * 4,
          h: 9 + rnd(i, 6) * 6,
          delay: rnd(i, 7) * 80,
        };
      }),
    [colors, count],
  );

  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 1400);
    return () => clearTimeout(t);
  }, []);

  if (!alive) return null;
  return (
    <div aria-hidden className="celebrate-confetti pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-[2px]"
          style={
            {
              left: "50%",
              top: originY,
              width: p.w,
              height: p.h,
              background: p.color,
              "--dx": `${p.dx}px`,
              "--dy": `${p.dy}px`,
              "--rot": `${p.rot}deg`,
              animation: `confetti-burst 1100ms cubic-bezier(0.2, 0.7, 0.3, 1) ${p.delay}ms both`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Rund flueben-badge, der tegner sig selv. */
export function CheckBurst({
  size = 64,
  bg = "#1C1917",
  fg = "#FAF8F4",
}: {
  size?: number;
  bg?: string;
  fg?: string;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex items-center justify-center rounded-full"
      style={{ width: size, height: size, background: bg, animation: "celebrate-pop 420ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
    >
      <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52} fill="none">
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          stroke={fg}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 24, animation: "celebrate-check 380ms 160ms ease-out both" }}
        />
      </svg>
    </span>
  );
}

/**
 * Kassens bekraeftelse: flueben + overskrift + een linje, med konfetti. Vises
 * oeverst paa skaermen og forsvinder selv efter et par sekunder.
 */
export function CelebrationToast({
  title,
  text,
  onDone,
}: {
  title: string;
  text?: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <>
      <Confetti colors={["#1C1917", "#A6502E", "#E2DDD5", "#C9A24B"]} originY="18%" />
      {/* Centreringen ligger paa den ydre boks, saa pop-animationen (transform)
          ikke skubber toasten ud af midten. */}
      <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <div
          role="status"
          className="pointer-events-auto flex w-full max-w-[26rem] items-center gap-4 rounded-2xl border border-fog bg-white px-5 py-4 shadow-lift"
          style={{ animation: "celebrate-pop 380ms cubic-bezier(0.16, 1, 0.3, 1) both" }}
        >
          <CheckBurst size={44} />
          <div className="min-w-0">
            <p className="text-[1rem] font-[600] text-ink">{title}</p>
            {text ? <p className="mt-0.5 text-[0.85rem] leading-snug text-stone">{text}</p> : null}
          </div>
        </div>
      </div>
    </>
  );
}
