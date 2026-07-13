"use client";

import { useState } from "react";
import Image from "next/image";
import { btnClass } from "@/components/ui";

export function WebCardActions({
  serial,
  serialQr,
  walletEnabled,
  rewardReady,
  openQr = false,
}: {
  serial: string;
  serialQr: string;
  walletEnabled: boolean;
  rewardReady: boolean;
  /** Vis kort-QR'en med det samme (fx naar kunden kommer fra cooldown og skal
   *  vise kortet til personalet). */
  openQr?: boolean;
}) {
  const [showQr, setShowQr] = useState(rewardReady || openQr);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        onClick={() => setShowQr((v) => !v)}
        className={btnClass(rewardReady ? "primary" : "outline", "md") + " w-full"}
      >
        {showQr ? "Skjul QR" : "Vis QR"}
      </button>

      {walletEnabled ? (
        <a
          href={`/api/wallet/pass/${serial}`}
          className={btnClass("primary", "md") + " w-full"}
        >
          Læg i Apple Wallet
        </a>
      ) : null}

      {showQr ? (
        <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-fog bg-white p-4">
          <Image
            src={serialQr}
            alt={`QR for ${serial}`}
            width={200}
            height={200}
            className="h-48 w-48"
            unoptimized
          />
          <span className="text-[0.7rem] font-[400] tracking-[0.28em] text-ink">
            {serial}
          </span>
          <span className="text-[0.68rem] font-[200] text-slate">
            Personalet scanner denne kode
          </span>
        </div>
      ) : null}
    </div>
  );
}
