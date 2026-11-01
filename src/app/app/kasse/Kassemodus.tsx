"use client";

import { useEffect, useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StampIconKey } from "@/lib/brand";
import { enterFullscreen, exitFullscreen, KioskShell, StampQrPanel } from "./kiosk";
import { ScanPanel } from "./ScanPanel";

// Kassen: vaelg mellem at vise stempel-QR, scanne kundens kort og kioskmodus.
// Delene ligger i kiosk.tsx, ScanPanel.tsx og StaffCard.tsx.

export type KioskCard = {
  businessName: string;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  rewardText: string;
  stampsRequired: number;
  /** Lille webp-logo (data-URI), vist paa kundens kort efter scan. */
  logoSrc?: string | null;
};

function ExpandIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  );
}

// ── Dashboard-siden: vaelg mellem QR, scan og kassemodus ──────────────
export function Kassemodus({
  card,
  selfScan,
  hasPin,
  referrals = false,
  initialSerial = null,
}: {
  card: KioskCard;
  selfScan: boolean;
  // Har butikken sat en personale-PIN? Ellers indloeses uden PIN.
  hasPin: boolean;
  /** Henvisninger slaaet til: vis foerste besoeg og henvisningsbeloenninger ved kunden. */
  referrals?: boolean;
  /** Aabn en bestemt kunde direkte (fra Kunder eller Hjem: ?kort=). */
  initialSerial?: string | null;
}) {
  const [mode, setMode] = useState<"qr" | "scan">(initialSerial ? "scan" : "qr");
  const [kioskOpen, setKioskOpen] = useState(false);

  // Kun ved selvbetjening: startet fra hjemmeskaermen (standalone) -> aabn
  // kiosken direkte.
  useEffect(() => {
    if (!selfScan) return;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) setKioskOpen(true);
  }, [selfScan]);

  const openKiosk = () => {
    enterFullscreen();
    setKioskOpen(true);
  };
  const closeKiosk = () => {
    exitFullscreen();
    setKioskOpen(false);
  };

  // Uden selvbetjening (standard): kun personalet scanner kundens kort. Ingen
  // QR-visning, ingen kassemodus.
  if (!selfScan) {
    return (
      <div className="flex flex-col gap-7">
        <ScanPanel hasPin={hasPin} referrals={referrals} initialSerial={initialSerial} logoSrc={card.logoSrc ?? null} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* Valg-linje: de to daglige tilstande + kassemodus */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-1 rounded-lg border border-fog bg-white shadow-card p-1 sm:w-auto">
          {(
            [
              ["qr", "Vis stempel-QR"],
              ["scan", "Scan kundens kort"],
            ] as ["qr" | "scan", string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              aria-pressed={mode === key}
              className={cn(
                "flex min-h-11 flex-1 items-center justify-center rounded-md px-5 text-[0.85rem] font-[300] tracking-[0.01em] transition-colors sm:flex-none",
                mode === key
                  ? "bg-ink text-parchment"
                  : "text-stone hover:text-ink",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={openKiosk}
          className={btnClass("outline") + " gap-2"}
        >
          <ExpandIcon className="h-4 w-4" />
          Åbn kassemodus
        </button>
      </div>

      {mode === "qr" ? <StampQrPanel card={card} /> : <ScanPanel hasPin={hasPin} referrals={referrals} initialSerial={initialSerial} logoSrc={card.logoSrc ?? null} />}

      {kioskOpen ? <KioskShell card={card} onClose={closeKiosk} /> : null}
    </div>
  );
}
