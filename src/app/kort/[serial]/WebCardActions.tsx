"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Scanner } from "@/components/Scanner";
import { btnClass } from "@/components/ui";

export function WebCardActions({
  serial,
  serialQr,
  walletEnabled,
  rewardReady,
}: {
  serial: string;
  serialQr: string;
  walletEnabled: boolean;
  rewardReady: boolean;
}) {
  const [scanning, setScanning] = useState(false);
  const [showQr, setShowQr] = useState(rewardReady);
  const [note, setNote] = useState<string | null>(null);

  const handleResult = useCallback((text: string) => {
    // Kassemodus-QR peger på /s/[token]. Følg den for at få et stempel.
    if (text.includes("/s/")) {
      window.location.href = text;
      return;
    }
    setScanning(false);
    setNote("Det var ikke en stempel-kode. Bed personalet vise stempel-QR'en.");
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {!rewardReady ? (
        <button
          onClick={() => {
            setNote(null);
            setScanning(true);
          }}
          className={btnClass("moss", "lg") + " w-full"}
        >
          Scan for stempel
        </button>
      ) : null}

      <button
        onClick={() => setShowQr((v) => !v)}
        className={btnClass("outline", "md") + " w-full"}
      >
        {showQr ? "Skjul kode" : "Vis ved kassen"}
      </button>

      {walletEnabled ? (
        <a
          href={`/api/wallet/pass/${serial}`}
          className={btnClass("primary", "md") + " w-full"}
        >
          Læg i Apple Wallet
        </a>
      ) : null}

      {note ? (
        <p className="text-center text-[0.8rem] font-[200] text-stone">{note}</p>
      ) : null}

      {showQr ? (
        <div className="mt-2 flex flex-col items-center gap-2 rounded-sm border border-fog bg-white p-4">
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

      {scanning ? (
        <Scanner
          onResult={handleResult}
          onClose={() => setScanning(false)}
          hint="Ret kameraet mod butikkens stempel-QR."
        />
      ) : null}
    </div>
  );
}
