"use client";

import { useEffect, useRef, useState } from "react";
import { Section, Eyebrow } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { cn } from "@/lib/utils";

// Animeret forklaring: eet kort koerer hele livscyklussen igennem, og de tre
// trin til venstre lyser med. Loopet starter, naar sektionen ses, og respekterer
// reduceret bevaegelse (viser en rolig statisk tilstand).

type Phase = "scan" | "fill" | "reward";
const REQUIRED = 10;
const PHASE_INDEX: Record<Phase, number> = { scan: 0, fill: 1, reward: 2 };

const STEPS: { kicker: string; title: string; body: string }[] = [
  {
    kicker: "01",
    title: "Kunden scanner QR-koden",
    body: "Kameraet på skiltet ved disken, og kortet ligger i Apple Wallet, før kaffen er skænket. Ingen app, ingen tilmelding, ingen e-mail.",
  },
  {
    kicker: "02",
    title: "Hvert køb giver et stempel",
    body: "Butikkens QR eller jeres scanning, ét tryk pr. kop. Kortet tæller op i Wallet og siger pænt goddag fra kundens låseskærm.",
  },
  {
    kicker: "03",
    title: "Fuldt kort, fortjent belønning",
    body: "Personalet frigiver med PIN, kortet nulstiller, og kunden har allerede en god grund til at kigge forbi igen.",
  },
];

export default function HowItWorks() {
  const [phase, setPhase] = useState<Phase>("scan");
  const [stamps, setStamps] = useState(0);
  const [pin, setPin] = useState(0);
  const [pop, setPop] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("fill");
      setStamps(7);
      return;
    }

    let alive = true;
    // visible: er scenen i viewporten? running: koerer en cyklus lige nu?
    // Loopet pauser, naar scenen scrolles ud af syne, saa mobilen ikke
    // gentegner kortet i baggrunden, og genoptages naar den ses igen.
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
                if (p < 4) wait(() => pinStep(p + 1), 280);
                // Loop-punkt: fortsaet kun, hvis scenen stadig ses.
                else if (visible) wait(cycle, 1700);
                else running = false;
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
          // Start (eller genoptag) kun, naar scenen er i syne og intet koerer.
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

  const activeIdx = PHASE_INDEX[phase];

  return (
    <Section id="sådan" className="scroll-mt-24 bg-moss/[0.04]">
      <div className="max-w-xl">
        <Eyebrow>Få flere stamkunder</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Fra scan til fast gæst.
        </h2>
        <p className="mt-4 font-[300] text-[0.95rem] leading-[1.8] text-stone">
          Hele rejsen sker i kundens telefon, uden app og uden tilmelding. Her
          er den fra første scan til fuldt kort, vist på ét og samme kort.
        </p>
      </div>

      <div className="mt-14 grid items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* Trinene, synkroniseret med animationen. Paa mobil ligger den
            animerede scene oeverst, saa man ser den med det samme. */}
        <ol className="order-2 flex flex-col gap-2 md:order-2">
          {STEPS.map((s, i) => {
            const active = i === activeIdx;
            return (
              <li
                key={s.kicker}
                aria-current={active}
                className={cn(
                  "flex gap-5 rounded-lg border p-5 transition-all duration-500",
                  active
                    ? "border-moss/30 bg-white shadow-[0_12px_34px_-20px_rgba(45,95,74,0.55)]"
                    : "border-transparent opacity-55",
                )}
              >
                <span
                  className={cn(
                    "font-fraunces text-[1.2rem] font-light italic transition-colors duration-500",
                    active ? "text-moss" : "text-slate",
                  )}
                >
                  {s.kicker}
                </span>
                <div>
                  <h3 className="font-[400] text-[1.05rem] leading-[1.4] text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-1.5 font-[300] text-[0.88rem] leading-[1.7] text-stone">
                    {s.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Den animerede scene: eet kort, hele livscyklussen */}
        <div ref={stageRef} className="order-1 flex flex-col items-center gap-6 md:order-1">
          <div
            className={cn(
              "w-full max-w-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
              phase === "scan" ? "scale-[0.96] opacity-90" : "scale-100 opacity-100",
            )}
          >
            <StampCard
              businessName="Odense Craft Beer"
              landscape
              primaryColor="#1E4535"
              textColor="#EFE9DB"
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
                <span className="h-2 w-2 animate-pulse rounded-full bg-moss" />
                Kortet lander i Apple Wallet på fem sekunder
              </span>
            ) : null}
            {phase === "fill" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-clay bg-white px-4 py-2 text-[0.78rem] font-[300] tabular-nums text-stone">
                {stamps} af {REQUIRED} stempler
              </span>
            ) : null}
            {phase === "reward" ? (
              <div className="inline-flex items-center gap-3 rounded-full border border-moss/30 bg-moss/5 px-4 py-2 text-[0.78rem] font-[300] text-moss">
                {pin < 4 ? (
                  <>
                    <span>Personale-PIN</span>
                    <span className="flex gap-1.5">
                      {[0, 1, 2, 3].map((d) => (
                        <span
                          key={d}
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors duration-200",
                            d < pin ? "bg-moss" : "bg-moss/25",
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
      </div>
    </Section>
  );
}
