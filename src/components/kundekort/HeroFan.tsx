"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { MemberCard, type MemberCardData } from "./MemberCard";

// Viften paa forsiden som et hjul: kortene sidder paa en stor cirkel, og man kan
// swipe (eller traekke/bruge pilene paa computer) til hoejre og venstre, saa
// hjulet drejer og naeste kort kommer op i midten. Den foerste visning er den
// samme vifte som foer, med kortet start i midten.

const RADIUS = 1300; // cirklens radius i "fan-px" (skaleres med skaermen som foer)
const STEP_DEG = 7.5; // vinkel mellem to kort
const FADE_FROM = 26; // fuldt synlige ud til denne vinkel ...
const FADE_TO = 34; // ... og vaek herfra
const SPACING = 170; // afstand mellem to kort i midten (fan-px), ogsaa scroll pr. kort

// Samme skalering som den gamle vifte: 0.078vw pr. fan-px, mellem 0.55 og 1 px.
function scaleFor(width: number): number {
  return Math.max(0.55, Math.min(1, width * 0.00078));
}

function place(i: number, p: number) {
  const a = (i - p) * STEP_DEG;
  const rad = (a * Math.PI) / 180;
  const abs = Math.abs(a);
  return {
    x: RADIUS * Math.sin(rad),
    y: RADIUS * (1 - Math.cos(rad)),
    r: a,
    o: abs <= FADE_FROM ? 1 : Math.max(0, (FADE_TO - abs) / (FADE_TO - FADE_FROM)),
    z: 100 - Math.round(Math.abs(i - p) * 2),
  };
}

function cardStyle(i: number, p: number, delay: number): React.CSSProperties {
  const { x, y, r, o, z } = place(i, p);
  return {
    "--x": `calc(${x.toFixed(1)} * max(0.55px, min(1px, 0.078vw)))`,
    "--y": `${(y + 70).toFixed(1)}px`,
    "--r": `${r.toFixed(2)}deg`,
    "--d": `${delay}s`,
    "--w": "clamp(168px, 22vw, 250px)",
    opacity: o,
    visibility: o === 0 ? "hidden" : undefined,
    zIndex: z,
  } as React.CSSProperties;
}

export function HeroFan({ cards, start }: { cards: MemberCardData[]; start: number }) {
  const scroller = useRef<HTMLDivElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const step = useRef(SPACING);
  const frame = useRef(0);

  const render = useCallback(() => {
    frame.current = 0;
    const el = scroller.current;
    if (!el) return;
    const p = el.scrollLeft / step.current;
    items.current.forEach((node, i) => {
      if (!node) return;
      const { x, y, r, o, z } = place(i, p);
      node.style.setProperty("--x", `calc(${x.toFixed(1)} * max(0.55px, min(1px, 0.078vw)))`);
      node.style.setProperty("--y", `${(y + 70).toFixed(1)}px`);
      node.style.setProperty("--r", `${r.toFixed(2)}deg`);
      node.style.opacity = String(o);
      node.style.visibility = o === 0 ? "hidden" : "";
      node.style.zIndex = String(z);
    });
  }, []);

  const onScroll = useCallback(() => {
    if (!frame.current) frame.current = requestAnimationFrame(render);
  }, [render]);

  // Start paa det midterste kort, og hold positionen ved aendret skaermbredde.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const fit = () => {
      const p = el.scrollLeft / step.current;
      step.current = SPACING * scaleFor(window.innerWidth);
      el.style.setProperty("--step", `${step.current}px`);
      el.scrollLeft = p * step.current;
      render();
    };
    el.scrollLeft = 0;
    step.current = SPACING * scaleFor(window.innerWidth);
    el.style.setProperty("--step", `${step.current}px`);
    el.scrollLeft = start * step.current;
    render();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [start, render]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  // Mus: traek for at dreje (touch og trackpad scroller selv).
  const drag = useRef<{ x: number; left: number } | null>(null);
  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !scroller.current) return;
    drag.current = { x: e.clientX, left: scroller.current.scrollLeft };
    scroller.current.style.scrollSnapType = "none";
    scroller.current.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!drag.current || !scroller.current) return;
    scroller.current.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  }
  function onPointerUp() {
    const el = scroller.current;
    if (!drag.current || !el) return;
    drag.current = null;
    const target = Math.round(el.scrollLeft / step.current) * step.current;
    el.scrollTo({ left: target, behavior: "smooth" });
    // Snap tilbage, naar den bloede rulning er faerdig.
    window.setTimeout(() => {
      el.style.scrollSnapType = "";
    }, 400);
  }

  function go(dir: -1 | 1) {
    scroller.current?.scrollBy({ left: dir * step.current, behavior: "smooth" });
  }

  const n = cards.length;
  return (
    <div className="relative mx-auto mt-10 h-[250px] max-w-[1200px] sm:mt-14 sm:h-[380px]">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {cards.map((card, i) => (
          <div
            key={card.shop}
            ref={(node) => {
              items.current[i] = node;
            }}
            className="kk-fan-card"
            style={cardStyle(i, start, (i * 0.7) % 2.8)}
          >
            <div>
              <div className="kk-fan-in" style={{ "--i": `${0.15 + Math.min(Math.abs(i - start), 4) * 0.12}s` } as React.CSSProperties}>
                <MemberCard card={card} priority={i === start} sizes="250px" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Usynlig rulleflade oven paa kortene: giver swipe, trackpad og snap. */}
      <div
        ref={scroller}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-label="Eksempler på kort"
        className="absolute inset-0 cursor-grab snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        <div className="relative h-full" style={{ width: `calc(100% + ${n - 1} * var(--step, ${SPACING}px))` }}>
          {cards.map((card, i) => (
            <span
              key={card.shop}
              aria-hidden
              className="absolute top-0 h-px w-px snap-center"
              style={{ left: `calc(50% - ${(n - 1) / 2} * var(--step, ${SPACING}px) + ${i} * var(--step, ${SPACING}px))` }}
            />
          ))}
        </div>
      </div>

      {/* Pile til computer (paa telefonen swiper man). */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[200] hidden -translate-y-1/2 justify-between px-4 md:flex">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Forrige kort"
          className="kk-glass-pill pointer-events-auto flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="m15 6-6 6 6 6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Næste kort"
          className="kk-glass-pill pointer-events-auto flex h-11 w-11 items-center justify-center text-white/80 transition-colors hover:bg-white/15 hover:text-white"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
            <path d="m9 6 6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
