"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { hexToRgb } from "@/lib/brand";
import type { KioskCard } from "./Kassemodus";

// Kassens kunde-vendte del: stempel-QR'en, kioskmodus i fuld skaerm, wake lock
// og den signerede token, der skifter hvert minut.

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Fuldskaerm (Android/desktop; iOS bruger PWA-standalone) ────────────
export function enterFullscreen() {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
  };
  const fn = el.requestFullscreen || el.webkitRequestFullscreen;
  if (fn) {
    try {
      const p = fn.call(el) as Promise<void> | void;
      if (p && typeof (p as Promise<void>).catch === "function") {
        (p as Promise<void>).catch(() => {});
      }
    } catch {
      /* fuldskaerm er valgfrit */
    }
  }
}

export function exitFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
  } catch {
    /* ligegyldigt */
  }
}

// ── Wake Lock: hold skaermen vaagen i kioskmodus ──────────────────────
function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const request = async () => {
      try {
        if (
          "wakeLock" in navigator &&
          document.visibilityState === "visible" &&
          !sentinelRef.current
        ) {
          const s = await navigator.wakeLock.request("screen");
          if (cancelled) {
            s.release().catch(() => {});
            return;
          }
          sentinelRef.current = s;
          s.addEventListener("release", () => {
            sentinelRef.current = null;
          });
        }
      } catch {
        /* ikke kritisk */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };
  }, [active]);
}

// ── Token-hook: signeret stempel-QR med backoff + reconnect ───────────
function useKioskToken(active: boolean) {
  const [qr, setQr] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [offline, setOffline] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoffRef = useRef(2000);
  const aliveRef = useRef(false);

  const clearTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Timeren kalder den nyeste refresh via en ref (funktionen kan ikke pege paa
  // sig selv, foer den er erklaeret).
  const refreshRef = useRef<() => void>(() => {});
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/kiosk/token", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "fejl");
      if (!aliveRef.current) return;
      setQr(data.qrDataUrl);
      setSeconds(data.expiresInSeconds ?? 60);
      setOffline(false);
      backoffRef.current = 2000;
      const next = Math.max((data.expiresInSeconds ?? 60) - 5, 10) * 1000;
      clearTimer();
      timeoutRef.current = setTimeout(() => refreshRef.current(), next);
    } catch {
      if (!aliveRef.current) return;
      setOffline(true);
      const wait = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      clearTimer();
      timeoutRef.current = setTimeout(() => refreshRef.current(), wait);
    }
  }, []);
  useEffect(() => {
    refreshRef.current = () => void refresh();
  }, [refresh]);

  useEffect(() => {
    aliveRef.current = active;
    if (!active) {
      clearTimer();
      return;
    }
    backoffRef.current = 2000;
    refresh();
    return () => {
      aliveRef.current = false;
      clearTimer();
    };
  }, [active, refresh]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const kick = () => {
      if (!aliveRef.current) return;
      backoffRef.current = 2000;
      refresh();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") kick();
    };
    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", kick);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [active, refresh]);

  return { qr, seconds, offline };
}

// ── Panel: vis stempel-QR til kunden ──────────────────────────────────
export function StampQrPanel({ card }: { card: KioskCard }) {
  const { qr, seconds, offline } = useKioskToken(true);
  const showQr = qr && seconds > 0;
  const box = "h-[min(64vw,260px)] w-[min(64vw,260px)]";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border border-fog bg-white shadow-card p-8 text-center">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
            Scan og saml stempler
          </span>
          <span className="font-[300] text-[1.05rem] text-ink">
            {card.businessName}
          </span>
        </div>

        {showQr ? (
          <Image
            src={qr}
            alt="Stempel-QR"
            width={300}
            height={300}
            className={box}
            unoptimized
            priority
          />
        ) : offline ? (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-fog text-center",
              box,
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-9 w-9 text-slate"
            >
              <path d="M1 1l22 22M16.7 12.7A6 6 0 0 0 12 11M5 12.5a10 10 0 0 1 4-2M8.5 16.5a4 4 0 0 1 5 0M12 20h.01" />
            </svg>
            <p className="font-[300] text-[0.85rem] text-stone">
              Ingen forbindelse
            </p>
          </div>
        ) : (
          <div className={cn("animate-pulse rounded-lg bg-fog", box)} />
        )}

        <p className="text-[0.8rem] font-[300] text-slate">
          {showQr
            ? `Ny kode om ${seconds} sek.`
            : offline
              ? "Ingen forbindelse. Prøver igen"
              : "Henter kode..."}
        </p>
      </div>

      <p className="max-w-md text-center font-[300] text-[0.85rem] leading-relaxed text-stone">
        Vis skærmen til kunden. De scanner koden med deres eget kamera og får
        stemplet selv. Koden skifter hvert minut.
      </p>
    </div>
  );
}

// ── Kioskmodus: en ren, kunde-vendt QR-tavle i fuldskaerm ─────────────
// Kunden ser QR'en og scanner selv. Personalet scanner kundens kort fra
// Stempel-siden (ScanPanel), ikke herfra, saa kiosken kan staa mod kunden.
export function KioskShell({
  card,
  onClose,
}: {
  card: KioskCard;
  onClose: () => void;
}) {
  const { qr, seconds, offline } = useKioskToken(true);
  useWakeLock(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[120] overflow-hidden"
      style={{ background: card.primaryColor, color: card.textColor }}
    >
      <KioskQr
        card={card}
        qr={qr}
        seconds={seconds}
        offline={offline}
        onClose={onClose}
      />
    </div>
  );
}

function CloseButton({
  textColor,
  onClose,
}: {
  textColor: string;
  onClose: () => void;
}) {
  return (
    <button
      onClick={onClose}
      aria-label="Luk kassemodus"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full opacity-60 transition-opacity hover:opacity-100"
      style={{ border: `1px solid ${textColor}` }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        className="h-5 w-5"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

function KioskQr({
  card,
  qr,
  seconds,
  offline,
  onClose,
}: {
  card: KioskCard;
  qr: string | null;
  seconds: number;
  offline: boolean;
  onClose: () => void;
}) {
  const qrSize = "min(64vmin, 540px)";
  const showQr = qr && seconds > 0;

  return (
    <div className="flex h-full w-full flex-col items-center justify-between px-6 py-8 md:px-10 md:py-10">
      <div className="flex w-full items-center justify-between">
        <span className="font-[300] text-[1.4rem] tracking-[0.01em] md:text-[1.9rem]">
          {card.businessName}
        </span>
        <CloseButton textColor={card.textColor} onClose={onClose} />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7 py-6">
        <span
          className="text-[0.72rem] font-[500] uppercase tracking-[0.2em]"
          style={{ color: rgba(card.textColor, 0.7) }}
        >
          Scan og saml stempler
        </span>

        {showQr ? (
          <div className="rounded-[2rem] bg-white p-5 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)] md:p-6">
            <Image
              src={qr}
              alt="Stempel-QR"
              width={640}
              height={640}
              unoptimized
              priority
              style={{ width: qrSize, height: qrSize }}
            />
          </div>
        ) : offline ? (
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border p-6 text-center"
            style={{
              width: qrSize,
              height: qrSize,
              borderColor: rgba(card.textColor, 0.3),
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12"
              style={{ opacity: 0.8 }}
            >
              <path d="M1 1l22 22M16.7 12.7A6 6 0 0 0 12 11M5 12.5a10 10 0 0 1 4-2M8.5 16.5a4 4 0 0 1 5 0M12 20h.01" />
            </svg>
            <p className="font-[300] text-[1.3rem]">Ingen forbindelse</p>
            <p className="text-[0.95rem]" style={{ opacity: 0.7 }}>
              Prøver igen automatisk...
            </p>
          </div>
        ) : (
          <div
            className="animate-pulse rounded-[2rem] bg-white/15"
            style={{ width: qrSize, height: qrSize }}
          />
        )}

        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="font-[300] text-[1.35rem] leading-tight md:text-[1.6rem]">
            {card.stampsRequired} stempler, og så: {card.rewardText}
          </p>
          <p className="text-[0.9rem]" style={{ color: rgba(card.textColor, 0.6) }}>
            {showQr
              ? `Ny kode om ${seconds} sek.`
              : offline
                ? "Ingen forbindelse. Prøver igen"
                : "Henter kode..."}
          </p>
        </div>
      </div>
    </div>
  );
}
