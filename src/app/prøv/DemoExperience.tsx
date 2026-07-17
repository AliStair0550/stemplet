"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnClass, CtaGlow, WalletIcon, CTA_EMPHASIS } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import type { StampIconKey } from "@/lib/brand";

type Card = { serial: string; stamps: number; required: number };

// "Prøv det selv": vis hvor nemt det er at FÅ kortet i sin egen Apple Wallet.
// Selve stemplingen sker ved kassen (personalet scanner kortet), saa demoen
// stopper her, praecis som en rigtig kunde starter.
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

  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
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
            stamps: data.stamps ?? 0,
            required: data.required,
          });
          setStatus("ready");
        } else {
          setStatus("unavailable");
        }
      } catch {
        setStatus("unavailable");
      }
    })();
  }, [knownToken, remember]);

  if (status === "unavailable") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-fog bg-white p-8 text-center shadow-card">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <StampIcon icon={icon} className="h-7 w-7" />
        </span>
        <p className="font-[300] text-[0.95rem] text-stone">
          Demoen er lige nu ikke tilgængelig. Prøv igen om lidt.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[20rem] flex-col items-center gap-6">
      {/* Kortet i fuld bredde, saa alle felter er synlige (intet klippes). */}
      <div className="w-full">
        <StampCard
          businessName={businessName}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          textColor={textColor}
          stampIcon={icon}
          stamps={card?.stamps ?? 0}
          required={required}
          rewardText={rewardText}
          serial={card?.serial}
        />
      </div>

      <p className="text-center font-[300] text-[0.9rem] leading-relaxed text-stone">
        Læg kortet i din Wallet, så er du klar til at få stempler ved kassen.
      </p>

      <div className="flex w-full flex-col items-center gap-3">
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
              Hent mit stempelkort
            </a>
          </CtaGlow>
        ) : null}
        {card ? (
          <a
            href={`/kort/${card.serial}?vis=1`}
            className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
          >
            Bruger du Android? Åbn webkortet
          </a>
        ) : null}
      </div>
    </div>
  );
}
