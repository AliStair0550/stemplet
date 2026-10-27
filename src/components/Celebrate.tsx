"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

// Fejring (Henvisninger): konfetti i to boelger og et flueben, der tegnes. Kort
// (under 3 sek.), uden lyd, og kun konfetti for den, der ikke har slaaet animationer
// fra (prefers-reduced-motion skjuler .celebrate-confetti i globals.css).

// Fast pseudo-tilfaeldighed ud fra partiklens nummer (ren funktion, saa React
// kan rendere den; Math.random er ikke tilladt under render).
function rnd(i: number, k: number): number {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type Shape = "tick" | "squiggle" | "dot" | "strip";

// Henvisningers eget formsprog: haandtegnede flueben (som app-ikonet) og smaa
// snirkler, blandet med prikker og papirstrimler.
const SHAPES: Shape[] = ["tick", "strip", "dot", "tick", "squiggle", "strip"];

/**
 * Konfetti i to boelger: et skud opad fra et punkt, saa et fald med tyngdekraft,
 * mens hver brik svajer og vender sig som papir. Fjerner sig selv bagefter.
 */
export function Confetti({
  colors,
  count = 64,
  originY = "32%",
}: {
  colors: string[];
  count?: number;
  originY?: string;
}) {
  const [alive, setAlive] = useState(true);
  // Toppunkt og fald regnes i forhold til startpunktet, saa brikkerne bliver paa
  // skaermen, uanset om fejringen starter hoejt (kassens toast) eller midt paa.
  const top = Number.parseFloat(originY) || 32;
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        // Foerste boelge (60 %) skyder hoejt og samlet; anden kommer lidt efter og bredere.
        const second = i >= Math.round(count * 0.6);
        const side = rnd(i, 1) < 0.5 ? -1 : 1;
        const spread = second ? 22 + rnd(i, 2) * 40 : 6 + rnd(i, 2) * 42;
        const shape = SHAPES[Math.floor(rnd(i, 3) * SHAPES.length)]!;
        const size = shape === "tick" ? 18 + rnd(i, 4) * 12 : shape === "squiggle" ? 22 + rnd(i, 4) * 10 : 8 + rnd(i, 4) * 6;
        return {
          shape,
          size,
          color: colors[i % colors.length]!,
          x0: (rnd(i, 5) - 0.5) * 40,
          peakX: side * spread * 0.55,
          peakY: -top * (second ? 0.35 + rnd(i, 6) * 0.35 : 0.55 + rnd(i, 6) * 0.4),
          endX: side * spread,
          endY: (100 - top) * (0.6 + rnd(i, 7) * 0.45),
          sway: 10 + rnd(i, 8) * 22,
          // Flueben og snirkler drejer kun lidt, saa de kan genkendes i luften.
          spin: (shape === "tick" || shape === "squiggle" ? 50 : 540) * (rnd(i, 9) < 0.5 ? -1 : 1) * (0.5 + rnd(i, 10)),
          flip: 1.2 + rnd(i, 11) * 1.6,
          duration: 2000 + rnd(i, 12) * 800,
          delay: (second ? 200 : 0) + rnd(i, 13) * 90,
        };
      }),
    [colors, count, top],
  );

  useEffect(() => {
    const t = setTimeout(() => setAlive(false), 3200);
    return () => clearTimeout(t);
  }, []);

  if (!alive || typeof document === "undefined") return null;
  // Portal til body: en forfader med transform (fx kundesidens indgangsanimation)
  // ville ellers goere "fixed" relativ til sig selv og klippe konfettien.
  return createPortal(
    <div aria-hidden className="celebrate-confetti pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute"
          style={
            {
              left: `calc(50% + ${p.x0}px)`,
              top: originY,
              "--peak-x": `${p.peakX}vw`,
              "--peak-y": `${p.peakY}vh`,
              "--end-x": `${p.endX}vw`,
              "--end-y": `${p.endY}vh`,
              animation: `confetti-fly ${p.duration}ms linear ${p.delay}ms both`,
            } as React.CSSProperties
          }
        >
          <span
            className="block"
            style={
              {
                "--sway": `${p.sway}px`,
                "--spin": `${p.spin}deg`,
                animation: `confetti-flutter ${p.duration}ms ease-in-out ${p.delay}ms both`,
              } as React.CSSProperties
            }
          >
            <span
              className="block"
              style={{ animation: `confetti-flip ${Math.round(p.duration / p.flip)}ms linear ${p.delay}ms infinite` }}
            >
              <Piece shape={p.shape} size={p.size} color={p.color} />
            </span>
          </span>
        </span>
      ))}
    </div>,
    document.body,
  );
}

function Piece({ shape, size, color }: { shape: Shape; size: number; color: string }) {
  if (shape === "dot") {
    return <span className="block rounded-full" style={{ width: size, height: size, background: color }} />;
  }
  if (shape === "strip") {
    return <span className="block rounded-[2px]" style={{ width: size * 0.55, height: size * 2, background: color }} />;
  }
  const d =
    shape === "tick"
      ? "M3 13.5c2.2 1.4 4 3.3 5.6 5.8C11.4 12.6 15.6 7.4 21 3.6"
      : "M2 12c2.5-5 5-5 7 0s4.5 5 7 0 4.5-5 6 0";
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" className="block">
      <path d={d} stroke={color} strokeWidth={shape === "tick" ? 3.2 : 2.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
