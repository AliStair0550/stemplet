"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import {
  btnClass,
  CtaGlow,
  WalletIcon,
  CTA_EMPHASIS,
} from "@/components/ui";
import { WalletAddedNotice } from "@/components/WalletAddedNotice";

export function WebCardActions({
  serial,
  walletEnabled,
}: {
  serial: string;
  walletEnabled: boolean;
}) {
  // QR'en er kundens vigtigste handling (personalet scanner den). Vi genererer
  // den EN gang paa klienten ud fra serienummeret, som aldrig aendrer sig. Foer
  // blev den regenereret paa serveren ved hvert live-refresh (hvert 6. sek.),
  // hvilket var spildt CPU og baandbredde.
  const [qr, setQr] = useState<string | null>(null);
  // Bro-QR til desktop: peger paa DENNE kort-side, saa telefonen kan aabne den og
  // laegge kortet i Apple Wallet. Apple Wallet findes kun paa iPhone, saa paa en
  // computer er en direkte .pkpass-download blind vej: vi bygger bro til telefonen.
  const [phoneQr, setPhoneQr] = useState<string | null>(null);
  // null = ikke afgjort endnu (undgaar at blinke forkert knap frem foer hydrering).
  const [isIos, setIsIos] = useState<boolean | null>(null);
  // Naar kunden har trykket "Laeg i Apple Wallet", aabner iOS Wallet-arket, mens
  // denne side bliver liggende. Der findes ingen paalidelig browser-haendelse for
  // "passet blev tilfoejet", saa vi bruger selve trykket som signal og viser et
  // naeste-skridt: hvad goer kunden nu.
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setIsIos(/iPhone|iPad|iPod/i.test(ua));

    let alive = true;
    QRCode.toDataURL(serial, {
      width: 420,
      margin: 1,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    })
      .then((d) => {
        if (alive) setQr(d);
      })
      .catch(() => {});
    QRCode.toDataURL(window.location.href, {
      width: 360,
      margin: 1,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    })
      .then((d) => {
        if (alive) setPhoneQr(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [serial]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Kortets eget QR: vises stort, personalet scanner den for at stemple. */}
      <div className="flex w-full flex-col items-center gap-2.5 rounded-xl border border-fog bg-white p-5 shadow-card">
        {qr ? (
          <Image
            src={qr}
            alt={`QR for ${serial}`}
            width={200}
            height={200}
            className="h-48 w-48"
            unoptimized
            priority
          />
        ) : (
          <div className="h-48 w-48 animate-pulse rounded-lg bg-fog" />
        )}
        <span className="text-[0.9rem] font-[400] text-ink">
          Vis denne til personalet
        </span>
        <span className="text-[0.66rem] font-[300] tracking-[0.24em] text-slate">
          {serial}
        </span>
      </div>

      {/* iPhone/iPad: læg direkte i Apple Wallet. */}
      {walletEnabled && isIos === true ? (
        <CtaGlow className="w-full">
          <a
            href={`/api/wallet/pass/${serial}`}
            onClick={() => setAdded(true)}
            className={`${btnClass("primary", "md")} ${CTA_EMPHASIS}`}
          >
            <WalletIcon />
            Læg i Apple Wallet
          </a>
        </CtaGlow>
      ) : null}

      {/* Naeste skridt: vises naar kunden har trykket paa Wallet-knappen, saa de
          ved, hvad de goer herfra. */}
      {walletEnabled && isIos === true && added ? <WalletAddedNotice /> : null}

      {/* Computer (eller Android): Apple Wallet findes kun paa iPhone, saa vi
          viser en QR, man scanner med telefonen for at faa kortet i Wallet. */}
      {walletEnabled && isIos === false ? (
        <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-fog bg-white p-5 shadow-card">
          <span className="inline-flex items-center gap-2 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            <WalletIcon />
            Apple Wallet
          </span>
          {phoneQr ? (
            <Image
              src={phoneQr}
              alt="Scan med din telefon for at lægge kortet i Apple Wallet"
              width={150}
              height={150}
              className="h-36 w-36"
              unoptimized
            />
          ) : (
            <div className="h-36 w-36 animate-pulse rounded-lg bg-fog" />
          )}
          <p className="max-w-[15rem] text-center text-[0.8rem] font-[300] leading-relaxed text-stone">
            Har du en iPhone? Scan koden med telefonens kamera, så lægger du
            kortet direkte i Apple Wallet.
          </p>
        </div>
      ) : null}
    </div>
  );
}
