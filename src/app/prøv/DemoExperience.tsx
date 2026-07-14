"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnClass, CtaGlow, WalletIcon, CTA_EMPHASIS } from "@/components/ui";
import { Celebration } from "@/components/Celebration";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import type { StampIconKey } from "@/lib/brand";

function haptic(p: number | number[]) {
  try {
    navigator.vibrate?.(p);
  } catch {
    // haptik er valgfrit
  }
}

type Card = { serial: string; stamps: number; required: number };

export function DemoExperience({
  slug,
  businessName,
  logoUrl,
  primaryColor,
  textColor,
  stampIcon,
  rewardText,
  required,
  walletEnabled,
}: {
  slug: string;
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  textColor: string;
  stampIcon: string;
  rewardText: string;
  required: number;
  walletEnabled: boolean;
}) {
  const [card, setCard] = useState<Card | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [pulse, setPulse] = useState(0);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const icon = stampIcon as StampIconKey;
  const storeKey = `stmpl_${slug}`;

  const knownToken = useCallback(() => {
    try {
      return localStorage.getItem(storeKey);
    } catch {
      return null;
    }
  }, [storeKey]);

  const remember = useCallback(
    (t: string) => {
      try {
        localStorage.setItem(storeKey, t);
      } catch {
        // localStorage kan vaere blokeret (privat browsing)
      }
    },
    [storeKey],
  );

  const ensureCard = useCallback(async () => {
    try {
      const res = await fetch("/api/demo/card", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ known: knownToken() }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.cardToken) remember(data.cardToken);
        setCard({
          serial: data.serial,
          stamps: data.stamps,
          required: data.required,
        });
        setStatus("ready");
      } else {
        setStatus("unavailable");
      }
    } catch {
      setStatus("unavailable");
    }
  }, [knownToken, remember]);

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    ensureCard();
  }, [ensureCard]);

  const stamps = card?.stamps ?? 0;
  const rewardReady = card ? card.stamps >= card.required : false;

  async function stampSelf() {
    if (!card || busyRef.current || rewardReady) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/demo/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ known: knownToken() }),
      });
      const data = await res.json();
      if (data.ok) {
        setCard((c) => (c ? { ...c, stamps: data.stamps } : c));
        setPulse((p) => p + 1);
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : [16, 45, 22]);
      } else if (data.code === "FULL") {
        setCard((c) => (c ? { ...c, stamps: data.stamps ?? c.required } : c));
      } else if (data.needCard) {
        await ensureCard();
      }
    } catch {
      // stille: knappen kan trykkes igen
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function resetDemo() {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ known: knownToken() }),
      });
      const data = await res.json();
      if (data.ok) setCard((c) => (c ? { ...c, stamps: 0 } : c));
    } catch {
      // stille
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (status === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-fog bg-white p-8 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-moss/10 text-moss">
          <StampIcon icon={icon} className="h-7 w-7" />
        </span>
        <p className="font-[300] text-[0.95rem] text-stone">
          Demoen er lige nu ikke tilgængelig. Prøv igen om lidt.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <Celebration show={rewardReady} />

      {/* Trin-indikator: hele loopet paa en linje */}
      <ol className="flex items-center gap-2 text-[0.7rem] font-[400] uppercase tracking-[0.1em]">
        {["Tilføj", "Stempl", "Se live"].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={
                (i === 0 && card) || (i === 1 && stamps > 0) || (i === 2 && stamps > 0)
                  ? "text-moss"
                  : "text-slate"
              }
            >
              {i + 1}. {s}
            </span>
            {i < 2 ? <span className="text-clay">·</span> : null}
          </li>
        ))}
      </ol>

      {/* Kortet med burst + flyvende "+1" ved stempel */}
      <div className="relative">
        <div
          key={pulse}
          style={
            pulse > 0
              ? {
                  animation:
                    "cardBurst 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }
              : undefined
          }
        >
          <StampCard
            businessName={businessName}
            logoUrl={logoUrl}
            primaryColor={primaryColor}
            textColor={textColor}
            stampIcon={icon}
            stamps={stamps}
            required={required}
            rewardText={rewardText}
            serial={card?.serial}
            pop={pulse > 0}
          />
        </div>
        {pulse > 0 && !rewardReady ? (
          <span
            key={pulse}
            aria-hidden
            className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 select-none rounded-full bg-moss px-3.5 py-1 text-[0.8rem] font-[400] text-white shadow-lift"
            style={{ animation: "plusOne 1.15s ease-out forwards" }}
          >
            +1 stempel
          </span>
        ) : null}
      </div>

      {rewardReady ? (
        <p className="text-center font-[300] text-[0.92rem] leading-relaxed text-stone">
          Kortet er fuldt. Præcis dét øjeblik dine kunder jagter, og hvorfor de
          kommer igen.
        </p>
      ) : (
        <p className="text-center font-[300] text-[0.9rem] leading-relaxed text-stone">
          {stamps === 0
            ? "Læg kortet i din Wallet, og giv dig selv et stempel. Se det opdatere live."
            : `${required - stamps} ${
                required - stamps === 1 ? "stempel" : "stempler"
              } tilbage. Åbn din Wallet og se kortet følge med.`}
        </p>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        {/* 1) Kortet i Wallet */}
        {walletEnabled ? (
          <CtaGlow className="w-full max-w-xs">
            <a
              href={card ? `/api/wallet/pass/${card.serial}` : undefined}
              aria-disabled={!card}
              className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} ${
                card ? "" : "pointer-events-none opacity-60"
              }`}
            >
              <WalletIcon />
              Læg i Apple Wallet
            </a>
          </CtaGlow>
        ) : null}

        {/* 2) Det magiske ekstra trin: stempl dig selv */}
        {rewardReady ? (
          <button
            type="button"
            onClick={resetDemo}
            disabled={busy}
            className={`${btnClass("outline", "lg")} w-full max-w-xs`}
          >
            Nulstil og prøv igen
          </button>
        ) : (
          <button
            type="button"
            onClick={stampSelf}
            disabled={busy || !card}
            className={`${btnClass(walletEnabled ? "outline" : "primary", "lg")} w-full max-w-xs gap-2`}
          >
            <StampIcon icon={icon} className="h-[1.1rem] w-[1.1rem]" />
            {busy ? "Et øjeblik..." : "Giv dig selv et stempel"}
          </button>
        )}

        {/* Android / uden Apple Wallet: webkort-fallback */}
        {card ? (
          <a
            href={`/kort/${card.serial}?vis=1`}
            className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
          >
            Bruger du Android? Åbn dit webkort
          </a>
        ) : null}
      </div>
    </div>
  );
}
