"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { autoCardName, claimCta } from "@/lib/card-name";
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
  qrDataUrl,
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
  qrDataUrl: string;
}) {
  const [card, setCard] = useState<Card | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">(
    "loading",
  );
  const [desktop, setDesktop] = useState(false);
  const icon = stampIcon as StampIconKey;
  useEffect(() => {
    setDesktop(!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !(navigator.maxTouchPoints > 1));
  }, []);
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
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#E8F0FB] text-[#1B5EAE]">
          <StampIcon icon={icon} className="h-7 w-7" />
        </span>
        <p className="text-[0.95rem] text-[#5F6B7E]">
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

      {desktop ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-5 shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR-kode til prøvekortet" width={180} height={180} className="h-[180px] w-[180px]" />
          <p className="max-w-[16rem] text-center text-[0.9rem] text-[#5F6B7E]">Scan med din telefon for at hente prøvekortet.</p>
        </div>
      ) : (
        <p className="text-center text-[0.9rem] leading-relaxed text-[#5F6B7E]">Læg kortet i din Wallet. Så er du klar til stempler ved kassen.</p>
      )}

      <div className="flex w-full flex-col items-center gap-3">
        {walletEnabled && !desktop ? (
          <CtaGlow className="w-full">
            <a
              href={card ? `/api/wallet/pass/${card.serial}` : undefined}
              aria-disabled={!card}
              className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} ${
                card ? "" : "pointer-events-none opacity-60"
              }`}
            >
              <WalletIcon />
              {claimCta(autoCardName(businessName))}
            </a>
          </CtaGlow>
        ) : null}
        {card && !desktop ? (
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
