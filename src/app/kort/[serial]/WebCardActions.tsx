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
  useEffect(() => {
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
    return () => {
      alive = false;
    };
  }, [serial]);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* QR vises med det samme, stort og tydeligt. */}
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

      {walletEnabled ? (
        <CtaGlow className="w-full">
          <a
            href={`/api/wallet/pass/${serial}`}
            className={`${btnClass("primary", "md")} ${CTA_EMPHASIS}`}
          >
            <WalletIcon />
            Læg i Apple Wallet
          </a>
        </CtaGlow>
      ) : null}
    </div>
  );
}
