"use client";

import { useEffect, useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";
import type { StampIconKey } from "@/lib/brand";

type Props = {
  businessName: string;
  serialLabel: string;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  stampsRequired: number;
  rewardText: string;
  logoUrl: string | null;
};

// Loyalitets-loopet fortalt fra A til Z, til butiksejeren. Kortet er butikkens
// EGET design, saa de ser praecis, hvordan deres kort skaber en fast kunde.
const BEATS = [
  {
    title: "Kunden scanner din QR",
    body: "Kortet lander direkte i deres Apple Wallet. Ingen app, ingen tilmelding.",
  },
  {
    title: "Hvert besøg giver et stempel",
    body: "Personalet scanner kortet ved kassen. Ét tryk, så tæller besøget.",
  },
  {
    title: "Belønningen låser op",
    body: "Kortet er fuldt, og kunden får sin belønning.",
  },
  {
    title: "Og de kommer igen",
    body: "Sådan bliver et enkelt besøg til en fast kunde.",
  },
];

export function LoyaltyStory(props: Props) {
  const required = Math.max(1, props.stampsRequired);
  const [stamps, setStamps] = useState(0);
  const [beat, setBeat] = useState(0);
  const [reduce, setReduce] = useState(false);
  const cancelled = useRef(false);

  useEffect(() => {
    const prefersReduce =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (prefersReduce) {
      setReduce(true);
      setStamps(required);
      setBeat(2);
      return;
    }

    cancelled.current = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));
    // Hold den samlede fyld-tid nogenlunde ens, uanset antal stempler.
    const perStamp = Math.max(280, Math.round(2600 / required));

    (async () => {
      while (!cancelled.current) {
        setBeat(0);
        setStamps(0);
        await wait(2000);
        if (cancelled.current) break;

        setBeat(1);
        for (let s = 1; s <= required; s++) {
          setStamps(s);
          await wait(s === required ? 300 : perStamp);
          if (cancelled.current) break;
        }
        if (cancelled.current) break;

        setBeat(2);
        await wait(2400);
        if (cancelled.current) break;

        setBeat(3);
        await wait(1800);
      }
    })();

    return () => {
      cancelled.current = true;
      timers.forEach(clearTimeout);
    };
  }, [required]);

  const b = BEATS[beat];

  return (
    <div className="w-full">
      <p className="mb-4 text-center text-[0.66rem] font-[500] uppercase tracking-[0.16em] text-slate">
        Sådan skaber I loyalitet
      </p>
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-fog bg-sand/30 p-6 sm:p-8">
        <div className="w-full max-w-[19rem]">
          <StampCard
            businessName={props.businessName}
            logoUrl={props.logoUrl}
            primaryColor={props.primaryColor}
            textColor={props.textColor}
            stampIcon={props.stampIcon}
            stamps={stamps}
            required={required}
            rewardText={props.rewardText}
            serial="STEMPLET01"
            serialLabel={props.serialLabel}
            pop={!reduce}
            shine={!reduce}
          />
        </div>

        {/* Fortaellingen, der skifter i takt med kortet */}
        <div
          key={beat}
          className="min-h-[3.4rem] max-w-xs text-center animate-step"
        >
          <p className="font-[400] text-[1rem] text-ink">{b.title}</p>
          <p className="mt-1 font-[300] text-[0.84rem] leading-relaxed text-stone">
            {b.body}
          </p>
        </div>

        {/* Fremdrift gennem de fire trin */}
        <div className="flex items-center gap-2" aria-hidden>
          {BEATS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === beat ? "w-5 bg-terracotta" : "w-1.5 bg-clay"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
