"use client";

import { useEffect, useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";
import { cn } from "@/lib/utils";

// Animeret demo: eet kort koerer hele livscyklussen igennem (scan -> saml
// stempler -> indloes med PIN -> forfra), med status-tekst under kortet.
// Loopet starter, naar scenen ses, pauser naar den scrolles ud, og respekterer
// reduceret bevaegelse (viser en rolig statisk tilstand).

type Phase = "scan" | "fill" | "reward";
const REQUIRED = 10;

export default function AnimatedStampScene() {
  const [phase, setPhase] = useState<Phase>("scan");
  const [stamps, setStamps] = useState(0);
  const [pin, setPin] = useState(0);
  const [pop, setPop] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("fill");
      setStamps(7);
      return;
    }

    let alive = true;
    // visible: er scenen i viewporten? running: koerer en cyklus lige nu?
    // Loopet pauser, naar scenen scrolles ud af syne, og genoptages naar den ses.
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
      setPhase("scan");
      setStamps(0);
      setPin(0);
      setPop(false);
      setCelebrate(false);

      // Scan -> saml stempler
      wait(() => {
        setPhase("fill");
        const fillStep = (s: number) => {
          setPop(true);
          setStamps(s);
          if (s < REQUIRED) {
            wait(() => fillStep(s + 1), 300);
          } else {
            // Fuldt -> indloes med PIN -> ny runde
            wait(() => {
              setPhase("reward");
              const pinStep = (p: number) => {
                setPin(p);
                if (p < 4) {
                  wait(() => pinStep(p + 1), 280);
                } else {
                  // PIN tastet -> stor fejring, FOER kortet nulstiller.
                  setCelebrate(true);
                  if (visible) wait(cycle, 2600);
                  else running = false;
                }
              };
              wait(() => pinStep(1), 650);
            }, 950);
          }
        };
        wait(() => fillStep(1), 300);
      }, 1600);
    };

    let io: IntersectionObserver | null = null;
    const node = stageRef.current;
    if (node) {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          if (visible && !running) cycle();
        },
        { threshold: 0.3 },
      );
      io.observe(node);
    } else {
      visible = true;
      cycle();
    }

    return () => {
      alive = false;
      io?.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  return (
    <div ref={stageRef} className="flex flex-col items-center gap-6">
      <div
        className={cn(
          // Vipper til siden som hero-kortet; retter sig op paa hover.
          "relative w-full max-w-[19.5rem] rotate-[2deg] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5 hover:rotate-0",
          phase === "scan" ? "scale-[0.96] opacity-90" : "scale-100 opacity-100",
          celebrate && "animate-[cardBurst_0.6s_ease-out]",
        )}
      >
        {celebrate ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 -z-10 rounded-[1.7rem] ring-2 ring-terracotta"
            style={{ animation: "burstRing 0.7s ease-out forwards" }}
          />
        ) : null}
        <StampCard
          businessName="Odense Beer"
          primaryColor="#2A211A"
          textColor="#F1E7D8"
          stampIcon="beer"
          stamps={stamps}
          required={REQUIRED}
          rewardText="10. øl er gratis"
          pop={pop}
          shine={phase === "scan"}
        />
      </div>

      {/* Fase-chrome under kortet */}
      <div className="flex min-h-[2.75rem] items-center justify-center text-center">
        {phase === "scan" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-clay bg-white px-4 py-2 text-[0.78rem] font-[300] text-stone">
            <span className="h-2 w-2 animate-pulse rounded-full bg-terracotta" />
            Kortet lander i Apple Wallet på fem sekunder
          </span>
        ) : null}
        {phase === "fill" ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-clay bg-white px-4 py-2 text-[0.78rem] font-[300] tabular-nums text-stone">
            {stamps} af {REQUIRED} stempler
          </span>
        ) : null}
        {phase === "reward" ? (
          <div className="inline-flex items-center gap-3 rounded-full border border-terracotta/30 bg-terracotta/5 px-4 py-2 text-[0.78rem] font-[300] text-terracotta">
            {pin < 4 ? (
              <>
                <span>Personale-PIN</span>
                <span className="flex gap-1.5">
                  {[0, 1, 2, 3].map((d) => (
                    <span
                      key={d}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors duration-200",
                        d < pin ? "bg-terracotta" : "bg-terracotta/25",
                      )}
                    />
                  ))}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 12.5l4.5 4.5L19 7" />
                </svg>
                Belønning givet, og så begynder jagten forfra
              </span>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
