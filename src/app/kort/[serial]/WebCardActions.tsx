"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  claimUrl,
}: {
  serial: string;
  walletEnabled: boolean;
  // Absolut URL til den normale claim-side (/k/[slug]).
  claimUrl: string;
}) {
  // Kortets eget QR (serienummer): personalet scanner den for at stemple. Vises
  // paa mobilen, hvor kunden staar ved disken. Genereres EN gang paa klienten.
  const [qr, setQr] = useState<string | null>(null);
  // Bro-QR til computer: peger paa den NORMALE claim-side, saa en telefon der
  // scanner den koerer "Hent mit stempelkort" og lander direkte i Apple Wallet.
  // (Den maa IKKE pege paa dette webkort: passet dér er laast til den enhed, der
  // oprettede kortet, saa en anden telefon kan ikke hente det.)
  const [phoneQr, setPhoneQr] = useState<string | null>(null);
  // null = ikke afgjort endnu (undgaar at blinke forkert visning frem).
  const [isIos, setIsIos] = useState<boolean | null>(null);
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);
  // Naar kunden har trykket "Laeg i Apple Wallet", aabner iOS Wallet-arket, mens
  // denne side bliver liggende. Vi bruger selve trykket som signal og viser et
  // naeste-skridt.
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    setIsIos(/iPhone|iPad|iPod/i.test(ua));
    // "Desktop" = ikke en telefon/tablet. Kun her giver bro-QR'en mening.
    setIsDesktop(!/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(ua));

    let alive = true;
    // qrcode-libet loades foerst HER (dynamisk import), saa det ikke ligger i
    // sidens initiale JS-bundle.
    void import("qrcode").then(({ default: QRCode }) => {
      if (!alive) return;
      const opts = {
        margin: 1,
        color: { dark: "#1A1A1A", light: "#FFFFFF" },
      } as const;
      QRCode.toDataURL(serial, { ...opts, width: 420 })
        .then((d) => alive && setQr(d))
        .catch(() => {});
      QRCode.toDataURL(claimUrl, { ...opts, width: 360 })
        .then((d) => alive && setPhoneQr(d))
        .catch(() => {});
    });
    return () => {
      alive = false;
    };
  }, [serial, claimUrl]);

  // Indtil enheden er afgjort: en neutral skelet-boks (ingen forkert-visning-blink).
  if (isDesktop === null) {
    return (
      <div className="flex w-full flex-col items-center rounded-xl border border-fog bg-white p-5 shadow-card">
        <div className="h-48 w-48 animate-pulse rounded-lg bg-fog" />
      </div>
    );
  }

  // Computer: EEN QR (bro til telefonen) + vejledning. Kortets egen "vis til
  // personalet"-QR giver ingen mening paa en computer, saa den skjules her.
  if (isDesktop) {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-fog bg-white p-6 shadow-card">
        <span className="inline-flex items-center gap-2 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
          <WalletIcon />
          Hent på din mobil
        </span>
        {phoneQr ? (
          <Image
            src={phoneQr}
            alt="Scan med din mobil for at hente stempelkortet"
            width={180}
            height={180}
            className="h-44 w-44"
            unoptimized
            priority
          />
        ) : (
          <div className="h-44 w-44 animate-pulse rounded-lg bg-fog" />
        )}
        <p className="max-w-[17rem] text-center text-[0.85rem] font-[300] leading-relaxed text-stone">
          Scan koden med din mobils kamera, så henter du stempelkortet, klar til
          Apple Wallet.
        </p>
      </div>
    );
  }

  // Mobil: kortets egen QR som hovedartefakt (vis den til personalet), og paa
  // iPhone en direkte "Laeg i Apple Wallet".
  return (
    <div className="flex w-full flex-col items-center gap-4">
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

      {walletEnabled && isIos === true && added ? <WalletAddedNotice /> : null}

      <p className="max-w-xs text-center text-[0.72rem] font-[200] leading-relaxed text-slate">
        Bruger du Android? Vis QR-koden til personalet. Du kan også føje kortet
        til hjemmeskærmen, så har du det altid ved hånden.
      </p>
    </div>
  );
}
