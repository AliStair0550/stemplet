"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { btnClass } from "@/components/ui";
import { StaffCard } from "./StaffCard";

// Scan kundens kort (kamera eller kortnummer) og vis kortet bagefter.

// Kamera-scanneren (med jsQR) ligger i sin egen fil, saa den ikke er en del af
// kasse-sidens initiale JS-bundle.
const Scanner = dynamic(
  () => import("@/components/Scanner").then((m) => ({ default: m.Scanner })),
  { ssr: false },
);
// Den hentes dog straks, mens siden indlaeses: kameraet aabner med det samme
// ved kassen, saa ellers ventede kameraet paa endnu en hentning.
if (typeof window !== "undefined") void import("@/components/Scanner");

// ── Ikoner ────────────────────────────────────────────────────────────
function ScanFrameIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" />
    </svg>
  );
}

// ── Panel: scan kundens kort (personalet stempler selv) ───────────────
export function ScanPanel({
  hasPin,
  referrals,
  initialSerial,
  logoSrc,
}: {
  hasPin: boolean;
  referrals: boolean;
  initialSerial: string | null;
  logoSrc: string | null;
}) {
  // Scanning er den eneste funktion ved kassen, saa kameraet aabner med det
  // samme: trykker man "Stempel", er man klar til at scanne uden et ekstra tryk.
  // Bliver kameraet afvist/blokeret, viser Scanner en paen fejl med "Prøv igen".
  const [scanning, setScanning] = useState(!initialSerial);
  const [serial, setSerial] = useState<string | null>(initialSerial);
  // Manuel indtastning: fallback naar QR'en ikke kan scannes (glare, revnet
  // skaerm, afvist kamera, eller en desktop uden brugbart kamera).
  const [showManual, setShowManual] = useState(false);
  const [manualVal, setManualVal] = useState("");

  const onResult = (text: string) => {
    const value = text.includes("/kort/")
      ? (text.split("/kort/")[1]?.split(/[/?#]/)[0] ?? text)
      : text.trim();
    setScanning(false);
    setSerial(value);
  };

  if (serial) {
    return (
      <div className="flex justify-center">
        <StaffCard
          serial={serial}
          logoSrc={logoSrc}
          hasPin={hasPin}
          referrals={referrals}
          onRescan={() => {
            setSerial(null);
            setScanning(true);
          }}
          // Faerdig med denne kunde: aabn kameraet igen med det samme, saa naeste
          // kort kan scannes uden et ekstra tryk (rent scan-loop ved kassen).
          onExit={() => {
            setSerial(null);
            setScanning(true);
          }}
        />
        {scanning ? (
          <Scanner
            hint="Ret kameraet mod QR-koden på kundens kort."
            onClose={() => setScanning(false)}
            onResult={onResult}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border border-fog bg-white shadow-card p-10 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <ScanFrameIcon className="h-8 w-8" />
        </span>
        <div>
          <p className="font-[400] text-[1.1rem] text-ink">Scan kundens kort</p>
          <p className="mx-auto mt-1.5 max-w-xs font-[300] text-[0.85rem] leading-relaxed text-stone">
            Ret kameraet mod QR-koden på kundens kort. Så kan du give stempler
            eller indløse en belønning.
          </p>
        </div>
        <button
          onClick={() => setScanning(true)}
          className={btnClass("primary", "lg")}
        >
          Åbn kamera
        </button>

        {showManual ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = manualVal.trim();
              if (v) onResult(v);
            }}
            className="flex w-full max-w-xs items-center gap-2"
          >
            <input
              value={manualVal}
              onChange={(e) => setManualVal(e.target.value)}
              placeholder="Kortnummer eller link"
              autoFocus
              className="min-w-0 flex-1 border border-clay bg-parchment px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-terracotta"
            />
            <button type="submit" className={btnClass("outline")}>
              Slå op
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowManual(true)}
            className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
          >
            Kan koden ikke scannes? Skriv kortnummeret
          </button>
        )}
      </div>

      {scanning ? (
        <Scanner
          hint="Ret kameraet mod QR-koden på kundens kort."
          onClose={() => setScanning(false)}
          onResult={onResult}
        />
      ) : null}
    </div>
  );
}
