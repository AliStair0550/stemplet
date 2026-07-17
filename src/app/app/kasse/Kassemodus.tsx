"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import { Celebration } from "@/components/Celebration";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { cn } from "@/lib/utils";
import { hexToRgb, type StampIconKey } from "@/lib/brand";

// Kamera-scanneren (med jsQR) loades foerst, naar kameraet aabnes, saa den ikke
// ligger i kasse-sidens initiale JS-bundle.
const Scanner = dynamic(
  () => import("@/components/Scanner").then((m) => ({ default: m.Scanner })),
  { ssr: false },
);

// Kort haptik paa personalets enhed (telefon/tablet). Valgfrit.
function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // haptik er valgfrit
  }
}

// Unik noegle pr. stempel-handling. Bruges til server-side idempotens: samme
// noegle paa et retry (fx tabt svar paa daarligt wifi) giver ikke et ekstra
// stempel. Fallback hvis crypto.randomUUID ikke findes (meget gamle browsere).
function newIdemKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Gave-glyf til indloesnings-fejringen ("giv beloenningen nu").
function GiftGlyph({ className }: { className?: string }) {
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
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

export type KioskCard = {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  rewardText: string;
  stampsRequired: number;
};

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Ikoner ────────────────────────────────────────────────────────────
function ScanFrameIcon({ className }: { className?: string }) {
  return (
    <svg
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

// ── Fuldskaerm (Android/desktop; iOS bruger PWA-standalone) ────────────
function enterFullscreen() {
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

function exitFullscreen() {
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
      timeoutRef.current = setTimeout(() => refresh(), next);
    } catch {
      if (!aliveRef.current) return;
      setOffline(true);
      const wait = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * 2, 30000);
      clearTimer();
      timeoutRef.current = setTimeout(() => refresh(), wait);
    }
  }, []);

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

// ── Dashboard-siden: vaelg mellem QR, scan og kassemodus ──────────────
export function Kassemodus({
  card,
  selfScan,
}: {
  card: KioskCard;
  selfScan: boolean;
}) {
  const [mode, setMode] = useState<"qr" | "scan">("qr");
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
        <ScanPanel />
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

      {mode === "qr" ? <StampQrPanel card={card} /> : <ScanPanel />}

      {kioskOpen ? <KioskShell card={card} onClose={closeKiosk} /> : null}
    </div>
  );
}

// ── Panel: vis stempel-QR til kunden ──────────────────────────────────
function StampQrPanel({ card }: { card: KioskCard }) {
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

// ── Panel: scan kundens kort (personalet stempler selv) ───────────────
function ScanPanel() {
  const [scanning, setScanning] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);

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
          onRescan={() => {
            setSerial(null);
            setScanning(true);
          }}
          onExit={() => setSerial(null)}
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

// ── Delt: det scannede kort + giv stempel / indløs ────────────────────
type CardState = {
  serial: string;
  stamps: number;
  required: number;
  rewardReady: boolean;
  rewardText: string;
  stampIcon: string;
  primaryColor: string;
  textColor: string;
  businessName: string;
  // Livstid: samlet antal stempler kunden nogensinde har optjent hos butikken.
  lifetimeStamps: number;
};

function StaffCard({
  serial,
  onRescan,
  onExit,
}: {
  serial: string;
  onRescan: () => void;
  onExit: () => void;
}) {
  const [card, setCard] = useState<CardState | null>(null);
  const [loading, setLoading] = useState(true);
  // Hvorfor kort-opslaget fejlede: "offline" (kan proeves igen) vs "notfound"
  // (forkert kort, ny scanning kraeves). Styrer den tomme tilstand nedenfor.
  const [loadError, setLoadError] = useState<"offline" | "notfound" | null>(
    null,
  );
  const [pin, setPin] = useState("");
  // Antal stempler personalet giver paa denne scanning (fx tre kaffe = 3).
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Synkron guard: to hurtige tryk (touch double-tap) kan begge naa at fyre
  // onClick FOER React har sat disabled i DOM'en. En ref tjekkes/saettes
  // synkront og lukker det vindue, saa man aldrig giver to stempler paa eet tryk.
  const busyRef = useRef(false);
  // Idempotens-noegle for det NUVAERENDE stempel. Roteres foerst naar vi faar et
  // endeligt svar; beholdes ved tabt forbindelse, saa et nyt tryk deduplikeres
  // server-side i stedet for at give kunden et ekstra stempel.
  const stampKeyRef = useRef(newIdemKey());
  // Stiger for hvert stempel: bruges som key til at gen-udloese kortets
  // "burst"-animation og den flyvende "+1", saa personalet faar en tydelig
  // kvittering paa skaermen (Wallet-pass'et opdaterer Apple lidt senere).
  const [pulse, setPulse] = useState(0);
  // Hvor mange stempler seneste tryk gav (normalt 1, 2 ved dobbeltstempel-kampagne).
  const [lastInc, setLastInc] = useState(1);
  // Naar en beloenning lige er indloest: stor fejring + "giv beloenningen nu".
  // Baerer de reelle rest-stempler, saa kortet kan opdateres uden et ekstra kald.
  const [redeemed, setRedeemed] = useState<{
    rewardText: string;
    stamps: number;
    required: number;
  } | null>(null);

  const loadCard = useCallback(async (s: string) => {
    setLoading(true);
    setNote(null);
    setLoadError(null);
    try {
      const res = await fetch(
        `/api/staff/card?serial=${encodeURIComponent(s)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok) {
        setCard(data as CardState);
      } else {
        setCard(null);
        setLoadError("notfound");
        setNote({ ok: false, text: data.message ?? "Kortet blev ikke fundet." });
      }
    } catch {
      setCard(null);
      setLoadError("offline");
      setNote({ ok: false, text: "Tjek forbindelsen og prøv igen." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCard(serial);
  }, [serial, loadCard]);

  async function giveStamp() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/staff/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serial: card.serial,
          count: qty,
          // Samme noegle paa et retry -> server-side dedup (ingen dobbelt stempel).
          idempotencyKey: stampKeyRef.current,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Et identisk forsoeg behandles stadig. Behold noeglen, saa et nyt tryk
        // henter DET foerste resultat i stedet for at stemple igen.
        setNote({
          ok: false,
          text: data.message ?? "Stemplet behandles. Prøv igen om lidt.",
        });
        return;
      }
      // Vi fik et endeligt svar -> naeste stempel er en NY handling.
      stampKeyRef.current = newIdemKey();
      if (res.ok) {
        // Opdater kortet DIREKTE fra svaret, ingen ekstra hentning: personalet
        // ser stemplet med det samme (foer var der to kald i traek = langsomt).
        setCard({
          ...card,
          stamps: data.stamps,
          rewardReady: data.rewardReady,
          lifetimeStamps: data.lifetimeStamps ?? card.lifetimeStamps,
        });
        setLastInc(data.increment ?? 1);
        setPulse((p) => p + 1);
        setQty(1);
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : [16, 45, 22]);
        setNote({
          ok: true,
          text: data.rewardReady
            ? "Kortet er nu fuldt. Belønning klar."
            : `${data.increment ?? 1} ${(data.increment ?? 1) === 1 ? "stempel" : "stempler"} givet. ${data.stamps} af ${data.required}.`,
        });
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke stemple." });
        // Kortet var maaske allerede fuldt (en anden enhed stemplede) -> hent
        // den aktuelle tilstand, saa knappen matcher virkeligheden igen.
        if (data.code === "FULL") await loadCard(card.serial);
      }
    } catch {
      // Intet svar (daarligt wifi): BEHOLD noeglen, saa et nyt tryk deduplikeres
      // server-side i stedet for at give kunden et ekstra stempel.
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function redeem() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/staff/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial: card.serial, pin }),
      });
      const data = await res.json();
      if (res.ok) {
        // Stor kvittering: markér tydeligt at beloenningen skal gives NU, og
        // kraev et bevidst "OK" for at lukke, saa den ikke overses. Serveren
        // giver de reelle rest-stempler (normalt 0, evt. kampagne-overskud).
        setPin("");
        haptic([30, 50, 30, 50, 120]);
        setRedeemed({
          rewardText: card.rewardText,
          stamps: data.stamps ?? 0,
          required: data.required ?? card.required,
        });
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke indløse." });
        setPin("");
      }
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // Personalet har givet beloenningen og trykker OK: luk fejringen og vis det
  // nulstillede kort (opdateret lokalt fra svaret, saa intet ekstra kald kan
  // fejle her). Kortet i sig selv er kvitteringen, saa ingen ekstra note.
  function confirmRedeemed() {
    if (redeemed && card) {
      setCard({
        ...card,
        stamps: redeemed.stamps,
        rewardReady: redeemed.stamps >= redeemed.required,
      });
    }
    setNote(null);
    setRedeemed(null);
  }

  async function undo() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/staff/unstamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial: card.serial }),
      });
      const data = await res.json();
      if (res.ok) {
        setCard({
          ...card,
          stamps: data.stamps,
          rewardReady: data.stamps >= data.required,
          lifetimeStamps: data.lifetimeStamps ?? card.lifetimeStamps,
        });
        setNote({
          ok: true,
          text: `Fortrudt. ${data.stamps} af ${data.required}.`,
        });
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke fortryde." });
      }
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-fog bg-white p-6 shadow-[0_20px_50px_-30px_rgba(26,26,26,0.4)]">
      {redeemed ? (
        <>
          <Celebration show />
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="relative flex h-20 w-20 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-terracotta/20"
                style={{ animation: "burstRing 0.9s ease-out forwards" }}
              />
              <span
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-terracotta text-white"
                style={{
                  animation:
                    "giftOpen 0.72s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                <GiftGlyph className="h-9 w-9" />
              </span>
            </span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
                Belønning indløst
              </span>
              <h2
                className="font-fraunces text-[1.8rem] font-light italic leading-tight text-ink"
                style={{
                  animation:
                    "countPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                Giv belønningen nu
              </h2>
            </div>
            <p className="max-w-xs font-[300] text-[0.95rem] leading-relaxed text-stone">
              Giv{" "}
              <span className="font-[400] text-ink">{redeemed.rewardText}</span>{" "}
              til kunden.
            </p>
            <CtaGlow className="w-full max-w-xs">
              <button
                onClick={confirmRedeemed}
                className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} min-h-[3.6rem] text-[0.9rem]`}
              >
                OK, belønning givet
              </button>
            </CtaGlow>
          </div>
        </>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-10 w-10 animate-pulse rounded-full bg-terracotta/15" />
          <p className="font-[300] text-[0.9rem] text-stone">Henter kort...</p>
        </div>
      ) : card ? (
        <>
          <div className="relative">
            <div
              key={`card-${pulse}`}
              style={
                pulse > 0
                  ? {
                      animation:
                        "cardBurst 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                    }
                  : undefined
              }
            >
              <StampCard
                businessName={card.businessName}
                primaryColor={card.primaryColor}
                textColor={card.textColor}
                stampIcon={card.stampIcon as StampIconKey}
                stamps={card.stamps}
                required={card.required}
                rewardText={card.rewardText}
                serial={card.serial}
              />
            </div>
            {pulse > 0 ? (
              <span
                key={`plus-${pulse}`}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 select-none rounded-full bg-terracotta px-3 py-1 text-[0.8rem] font-[400] text-white shadow-lift"
                style={{ animation: "plusOne 1.15s ease-out forwards" }}
              >
                +{lastInc} {lastInc === 1 ? "stempel" : "stempler"}
              </span>
            ) : null}
          </div>

          {/* Diskret livstidstal: forstyrrer ikke stempel-flowet, men lader
              personalet se hvor loyal kunden er. */}
          {card.lifetimeStamps > 0 ? (
            <p className="text-center text-[0.78rem] font-[300] text-slate">
              <span className="font-[400] tabular-nums text-stone">
                {card.lifetimeStamps}
              </span>{" "}
              {card.lifetimeStamps === 1 ? "stempel" : "stempler"} i alt hos jer
            </p>
          ) : null}

          {note ? (
            <p
              className={cn(
                "text-center font-[300] text-[0.9rem]",
                note.ok ? "text-terracotta" : "text-rust",
              )}
            >
              {note.text}
            </p>
          ) : null}

          {card.rewardReady ? (
            <div className="flex flex-col gap-3 rounded-lg border border-terracotta bg-terracotta/5 p-5">
              <div>
                <p className="font-[400] text-[1rem] text-ink">Belønning klar</p>
                <p className="font-[300] text-[0.85rem] text-stone">
                  {card.rewardText}
                </p>
              </div>
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.66rem] font-[400] uppercase tracking-[0.12em] text-slate">
                  Personale-PIN for at indløse
                </span>
                <input
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="****"
                  autoFocus
                  aria-describedby="staff-pin-hint"
                  className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[300] tracking-[0.3em] text-ink outline-none focus:border-terracotta"
                />
                <span
                  id="staff-pin-hint"
                  className="text-[0.72rem] font-[300] text-slate"
                >
                  Indtast 4 til 6 cifre.
                </span>
              </label>
              <button
                onClick={redeem}
                disabled={busy || pin.length < 4}
                className={btnClass("primary") + " self-start"}
              >
                {busy ? "Indløser..." : "Indløs belønning"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-center text-[0.8rem] font-[300] text-slate">
                Kortet er scannet. Vælg antal og giv stemplet.
              </p>
              {/* Antal: hurtig-vaelg med eet tryk (fx tre kaffe = 3) */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[0.72rem] font-[400] uppercase tracking-[0.1em] text-slate">
                  Antal stempler
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQty(n)}
                      disabled={busy}
                      aria-pressed={qty === n}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-[1rem] font-[400] tabular-nums transition-colors disabled:opacity-50",
                        qty === n
                          ? "bg-ink text-parchment"
                          : "border border-clay bg-white text-ink hover:border-terracotta",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <CtaGlow>
                <button
                  onClick={giveStamp}
                  disabled={busy}
                  className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} min-h-[3.6rem] text-[0.9rem]`}
                >
                  {busy ? (
                    "Et øjeblik..."
                  ) : (
                    <>
                      <StampIcon
                        icon={card.stampIcon as StampIconKey}
                        className="h-[1.1rem] w-[1.1rem]"
                      />
                      {qty === 1 ? "Giv stempel" : `Giv ${qty} stempler`}
                    </>
                  )}
                </button>
              </CtaGlow>
            </div>
          )}

          {card.stamps > 0 ? (
            <button
              type="button"
              onClick={undo}
              disabled={busy}
              className="mx-auto text-[0.75rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-rust disabled:opacity-50"
            >
              Fortryd sidste stempel
            </button>
          ) : null}

          {/* Saa personalet ved besked, hvis kunden spoerger: Wallet-pass'et
              opdaterer sig selv efter et oejeblik (Apples baggrunds-push). */}
          <p className="rounded-lg bg-sand/50 px-4 py-3 text-center text-[0.74rem] font-[300] leading-relaxed text-slate">
            Vises stemplet ikke straks i kundens Wallet, opdaterer det sig selv
            om et øjeblik. Kunden kan åbne sit kort på telefonen og se det med
            det samme.
          </p>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="font-[400] text-[1rem] text-ink">
            {loadError === "offline"
              ? "Ingen forbindelse"
              : "Kortet blev ikke fundet"}
          </p>
          {note ? (
            <p className="font-[300] text-[0.88rem] text-rust">{note.text}</p>
          ) : null}
          {loadError === "offline" ? (
            <button
              type="button"
              onClick={() => loadCard(serial)}
              className={btnClass("primary")}
            >
              Prøv igen
            </button>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-fog pt-4">
        <button
          onClick={onRescan}
          className="text-[0.72rem] font-[400] uppercase tracking-[0.1em] text-terracotta transition-colors hover:text-terracotta-dark"
        >
          Scan nyt kort
        </button>
        <button
          onClick={onExit}
          className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
        >
          Færdig
        </button>
      </div>
    </div>
  );
}

// ── Kioskmodus: en ren, kunde-vendt QR-tavle i fuldskaerm ─────────────
// Kunden ser QR'en og scanner selv. Personalet scanner kundens kort fra
// Stempel-siden (ScanPanel), ikke herfra, saa kiosken kan staa mod kunden.
function KioskShell({
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
