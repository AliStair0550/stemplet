"use client";

import { useEffect, useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";
import type { StampIconKey } from "@/lib/brand";

type Props = {
  businessName: string;
  serialLabel: string;
  qrDataUrl: string;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  stampsRequired: number;
  rewardText: string;
  logoUrl: string | null;
};

// Loyalitets-loopet fortalt fra A til Z, til butiksejeren. Historien starter hos
// EJEREN (du deler QR-koden), gaar til KUNDEN (scanner, samler, faar beloenning)
// og lukker loopet (kommer igen). Kortet er butikkens eget design.
const BEATS = [
  {
    scene: "qr" as const,
    title: "Du deler din QR-kode",
    body: "Print den til kassen, sæt den i vinduet, eller del den online.",
  },
  {
    scene: "scan" as const,
    title: "Kunden scanner den",
    body: "Kortet lander direkte i deres Apple Wallet. Ingen app, ingen tilmelding.",
  },
  {
    scene: "card" as const,
    title: "Hvert besøg giver et stempel",
    body: "Personalet scanner kortet ved kassen. Ét tryk, så tæller besøget.",
  },
  {
    scene: "card" as const,
    title: "Belønningen låser op",
    body: "Kortet er fuldt, og kunden får sin belønning.",
  },
  {
    scene: "card" as const,
    title: "Og de kommer igen",
    body: "Sådan bliver et enkelt besøg til en fast kunde.",
  },
];

function QrScene({ qrDataUrl, scanning }: { qrDataUrl: string; scanning: boolean }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_18px_40px_-18px_rgba(28,25,23,0.4)] [animation:cardReceive_0.5s_ease-out]">
      <div className="relative h-[118px] w-[118px] overflow-hidden rounded-lg">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt=""
          className="h-full w-full object-contain"
        />
        {scanning ? (
          <>
            <span
              aria-hidden
              className="animate-demo-scan pointer-events-none absolute inset-x-1 top-0 h-[2px] rounded bg-terracotta shadow-[0_0_10px_2px_rgba(166,80,46,0.55)]"
            />
            <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-tl border-l-2 border-t-2 border-terracotta/70" />
            <span className="pointer-events-none absolute right-1 top-1 h-4 w-4 rounded-tr border-r-2 border-t-2 border-terracotta/70" />
            <span className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 rounded-bl border-b-2 border-l-2 border-terracotta/70" />
            <span className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 rounded-br border-b-2 border-r-2 border-terracotta/70" />
          </>
        ) : null}
      </div>
    </div>
  );
}

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
      setBeat(3);
      return;
    }

    cancelled.current = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => timers.push(setTimeout(r, ms)));
    const perStamp = Math.max(280, Math.round(2600 / required));

    (async () => {
      while (!cancelled.current) {
        setBeat(0);
        setStamps(0);
        await wait(2100);
        if (cancelled.current) break;

        setBeat(1);
        await wait(2300);
        if (cancelled.current) break;

        setBeat(2);
        setStamps(0);
        await wait(500);
        for (let s = 1; s <= required; s++) {
          setStamps(s);
          await wait(s === required ? 300 : perStamp);
          if (cancelled.current) break;
        }
        if (cancelled.current) break;

        setBeat(3);
        await wait(2400);
        if (cancelled.current) break;

        setBeat(4);
        await wait(1900);
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
      <p className="mb-2 text-center text-[0.66rem] font-[500] uppercase tracking-[0.16em] text-slate">
        Sådan skaber I loyalitet
      </p>

      {/* Overskrift OVER animationen */}
      <p
        key={`title-${beat}`}
        className="mb-4 min-h-[1.6rem] text-center font-fraunces font-light italic text-[1.35rem] leading-tight text-ink animate-step"
      >
        {b.title}
      </p>

      {/* Animations-scene: fortaeller historien */}
      <div className="rounded-2xl border border-fog bg-sand/30 p-6 sm:p-8">
        <div className="flex min-h-[18.5rem] items-center justify-center">
          {b.scene === "card" ? (
            <div key="card" className="w-full max-w-[15rem] animate-step">
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
          ) : (
            <div key="qr">
              <QrScene qrDataUrl={props.qrDataUrl} scanning={b.scene === "scan"} />
            </div>
          )}
        </div>

        {/* Brødtekst UNDER animationen */}
        <p
          key={`body-${beat}`}
          className="mx-auto mt-5 min-h-[2.6rem] max-w-xs text-center font-[300] text-[0.86rem] leading-relaxed text-stone animate-step"
        >
          {b.body}
        </p>

        {/* Fremdrift gennem de fem trin */}
        <div className="mt-4 flex items-center justify-center gap-2" aria-hidden>
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
