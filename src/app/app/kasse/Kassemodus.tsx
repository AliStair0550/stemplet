"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Scanner } from "@/components/Scanner";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Tab = "stempel" | "scan";

export function Kassemodus() {
  const [tab, setTab] = useState<Tab>("stempel");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-1 rounded-lg border border-fog bg-white p-1 self-start">
        {(
          [
            ["stempel", "Stempel-QR"],
            ["scan", "Scan kort"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "rounded-md px-4 py-2 text-[0.8rem] font-[300] tracking-[0.02em] transition-colors",
              tab === key ? "bg-moss text-parchment" : "text-stone hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "stempel" ? <StempelQr /> : <ScanMode />}
    </div>
  );
}

// ── Roterende stempel-QR til kundens kamera ──────────────────────────

function StempelQr() {
  const [qr, setQr] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/kiosk/token", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Kunne ikke hente kode.");
        return;
      }
      setError(null);
      setQr(data.qrDataUrl);
      setSeconds(data.expiresInSeconds ?? 60);
    } catch {
      setError("Ingen forbindelse.");
    }
  }, []);

  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 55000);
    timerRef.current = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => {
      clearInterval(poll);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [refresh]);

  function fullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else el.requestFullscreen?.();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-fog bg-white p-8">
        {error ? (
          <p className="max-w-xs text-center font-[200] text-[0.9rem] text-stone">
            {error}
          </p>
        ) : qr ? (
          <Image
            src={qr}
            alt="Stempel-QR"
            width={340}
            height={340}
            className="h-[min(70vw,340px)] w-[min(70vw,340px)]"
            unoptimized
            priority
          />
        ) : (
          <div className="h-[340px] w-[340px] animate-pulse rounded-xl bg-fog" />
        )}
        <p className="text-[0.8rem] font-[200] text-slate">
          Kunden scanner med kameraet. Ny kode om {seconds} sek.
        </p>
      </div>
      <p className="max-w-md text-center font-[200] text-[0.85rem] leading-relaxed text-stone">
        Stil enheden ved disken. Koden skifter hvert minut, saa et foto af
        skaermen er vaerdiloest bagefter.
      </p>
      <button onClick={fullscreen} className={btnClass("outline", "md")}>
        Fuldskaerm
      </button>
    </div>
  );
}

// ── Scan-modus: personalet scanner kundens kort ──────────────────────

type ActionResult = {
  ok: boolean;
  message?: string;
  stamps?: number;
  required?: number;
  rewardReady?: boolean;
};

function ScanMode() {
  const [scanning, setScanning] = useState(false);
  const [serial, setSerial] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);

  function reset() {
    setSerial(null);
    setResult(null);
    setPin("");
    setShowPin(false);
  }

  const onResult = useCallback((text: string) => {
    // Kortets QR indeholder serienummeret direkte.
    const value = text.includes("/kort/")
      ? (text.split("/kort/")[1]?.split(/[/?#]/)[0] ?? text)
      : text.trim();
    setSerial(value);
    setResult(null);
    setScanning(false);
  }, []);

  async function giveStamp() {
    if (!serial) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const data = await res.json();
      setResult(
        res.ok
          ? {
              ok: true,
              stamps: data.stamps,
              required: data.required,
              rewardReady: data.rewardReady,
              message: data.rewardReady
                ? "Kortet er fuldt. Beloenning klar."
                : `Stempel ${data.stamps} af ${data.required}.`,
            }
          : { ok: false, message: data.message },
      );
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!serial) return;
    setBusy(true);
    try {
      const res = await fetch("/api/staff/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial, pin }),
      });
      const data = await res.json();
      setResult(
        res.ok
          ? { ok: true, message: "Beloenning indloest. Kortet er nulstillet." }
          : { ok: false, message: data.message },
      );
      if (res.ok) setShowPin(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-5">
      {!serial ? (
        <button
          onClick={() => setScanning(true)}
          className={btnClass("moss", "lg")}
        >
          Scan kundens kort
        </button>
      ) : (
        <div className="flex flex-col gap-4 rounded-xl border border-fog bg-white p-6">
          <div>
            <div className="text-[0.62rem] font-[400] uppercase tracking-[0.14em] text-slate">
              Kort
            </div>
            <div className="font-[400] text-[1rem] tracking-[0.2em] text-ink">
              {serial}
            </div>
          </div>

          {result ? (
            <p
              className={cn(
                "text-[0.85rem] font-[200]",
                result.ok ? "text-moss" : "text-ink",
              )}
            >
              {result.message}
            </p>
          ) : null}

          {!showPin ? (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={giveStamp}
                disabled={busy}
                className={btnClass("primary")}
              >
                {busy ? "Et oejeblik..." : "Giv stempel"}
              </button>
              <button
                onClick={() => {
                  setResult(null);
                  setShowPin(true);
                }}
                className={btnClass("outline")}
              >
                Indloes beloenning
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                  Personale-PIN
                </span>
                <input
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[200] tracking-[0.3em] text-ink outline-none focus:border-moss"
                  autoFocus
                />
              </label>
              <div className="flex gap-3">
                <button
                  onClick={redeem}
                  disabled={busy || pin.length < 4}
                  className={btnClass("moss")}
                >
                  {busy ? "Indloeser..." : "Bekraeft indloesning"}
                </button>
                <button
                  onClick={() => setShowPin(false)}
                  className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate hover:text-ink"
                >
                  Annuller
                </button>
              </div>
            </div>
          )}

          <button
            onClick={reset}
            className="self-start text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate hover:text-ink"
          >
            Scan nyt kort
          </button>
        </div>
      )}

      {scanning ? (
        <Scanner
          onResult={onResult}
          onClose={() => setScanning(false)}
          hint="Ret kameraet mod kundens QR-kode."
        />
      ) : null}
    </div>
  );
}
