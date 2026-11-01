"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { offerEndLabel } from "@/lib/member-offers-shared";

const DAY = 86_400_000;
// Nedtaellingen vises den sidste uge; foer det blot datoen.
const COUNTDOWN_FROM = 7 * DAY;

const pad = (n: number) => String(n).padStart(2, "0");

function left(ms: number): string {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86_400);
  const h = Math.floor((s % 86_400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d} ${d === 1 ? "dag" : "dage"} ${h} t. ${m} min.`;
  return `${pad(h)}:${pad(m)}:${pad(s % 60)}`;
}

// Tidsbegraenset tilbud: "Slutter om 03:12:45", der taeller ned. Naar tiden er
// gaaet, hentes siden igen, og tilbuddet er vaek. Foer siden er vaagnet i
// browseren (og uden JavaScript) staar datoen, saa server og browser er enige.
export function OfferCountdown({ until, className, style }: { until: string; className?: string; style?: React.CSSProperties }) {
  const router = useRouter();
  const end = new Date(until).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, []);

  const ms = now === null ? null : end - now;
  useEffect(() => {
    if (ms !== null && ms <= 0) router.refresh();
  }, [ms !== null && ms <= 0, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (ms === null || ms > COUNTDOWN_FROM) {
    return (
      <p className={className} style={style}>
        {offerEndLabel(new Date(end))}
      </p>
    );
  }
  if (ms <= 0) {
    return (
      <p className={className} style={style}>
        Tilbuddet er slut
      </p>
    );
  }
  const urgent = ms < DAY;
  return (
    <p className={className} style={style} role="timer" aria-live="off">
      {urgent ? (
        <span aria-hidden className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle" />
      ) : null}
      Slutter om <span className="ml-1 tabular-nums">{left(ms)}</span>
    </p>
  );
}
