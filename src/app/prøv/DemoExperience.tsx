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

type Card = {
  serial: string;
  stamps: number;
  required: number;
  // Kortets token holdes i hukommelsen, saa stempling ALTID rammer SAMME kort,
  // selv naar localStorage/cookie svigter (fx privat browsing paa iOS). Uden
  // dette kunne hvert tryk oprette et nyt kort i stedet for at stemple.
  token: string;
};

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
          token: data.cardToken,
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
        // Token fra hukommelsen foerst: rammer ALTID samme kort.
        body: JSON.stringify({ known: card.token ?? knownToken() }),
      });
      const data = await res.json();
      if (data.ok) {
        setCard((c) => (c ? { ...c, stamps: data.stamps } : c));
        setPulse((p) => p + 1);
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : [16, 45, 22]);
      } else if (data.code === "FULL") {
        setCard((c) => (c ? { ...c, stamps: data.stamps ?? c.required } : c));
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
        body: JSON.stringify({ known: card?.token ?? knownToken() }),
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
    <div className="flex w-full max-w-[17rem] flex-col items-center gap-4">
      <Celebration show={rewardReady} />

      {/* Kortet med burst + flyvende "+1" ved stempel */}
      <div className="relative w-[15.5rem]">
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

      <div className="flex w-full flex-col items-center gap-3">
        {/* 1) Kortet i Wallet */}
        {walletEnabled ? (
          <CtaGlow className="w-full">
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
            className={`${btnClass("outline", "lg")} w-full`}
          >
            Nulstil og prøv igen
          </button>
        ) : (
          <button
            type="button"
            onClick={stampSelf}
            disabled={busy || !card}
            className={`${btnClass(walletEnabled ? "outline" : "primary", "lg")} w-full gap-2`}
          >
            <StampIcon icon={icon} className="h-[1.1rem] w-[1.1rem]" />
            {busy ? "Et øjeblik..." : "Giv dig selv et stempel"}
          </button>
        )}

        {/* Kort forklaring under knapperne */}
        <p className="mt-1 text-center font-[300] text-[0.82rem] leading-relaxed text-stone">
          {rewardReady
            ? "Kortet er fuldt. Præcis dét dine kunder kommer tilbage for."
            : stamps === 0
              ? "Åbn din Wallet og se kortet opdatere, hver gang du stempler."
              : `${required - stamps} ${
                  required - stamps === 1 ? "stempel" : "stempler"
                } tilbage.`}
        </p>

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
