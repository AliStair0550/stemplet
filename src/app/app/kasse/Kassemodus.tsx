"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Scanner } from "@/components/Scanner";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StampIconKey } from "@/lib/brand";

type Tab = "stempel" | "scan";

export function Kassemodus() {
  const [tab, setTab] = useState<Tab>("stempel");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-1 self-start rounded-lg border border-fog bg-white p-1">
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

      <p className="-mt-4 max-w-md text-[0.8rem] font-[200] leading-relaxed text-slate">
        {tab === "stempel"
          ? "Vis denne skærm til kunden — de scanner QR-koden med deres eget kamera og får stemplet selv."
          : "Brug kameraet til at scanne kundens kort, når du selv vil give et stempel eller indløse en belønning."}
      </p>

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
      <div className="flex flex-col items-center gap-4 rounded-sm border border-fog bg-white p-8">
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
          <div className="h-[340px] w-[340px] animate-pulse rounded-sm bg-fog" />
        )}
        <p className="text-[0.8rem] font-[200] text-slate">
          Kunden scanner med kameraet. Ny kode om {seconds} sek.
        </p>
      </div>
      <p className="max-w-md text-center font-[200] text-[0.85rem] leading-relaxed text-stone">
        Stil enheden ved disken. Koden skifter hvert minut, så et foto af
        skærmen er værdiløst bagefter.
      </p>
      <button onClick={fullscreen} className={btnClass("outline", "md")}>
        Fuldskærm
      </button>
    </div>
  );
}

// ── Scan-modus: personalet scanner kundens kort ──────────────────────

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
};

function ScanMode() {
  const [scanning, setScanning] = useState(false);
  const [card, setCard] = useState<CardState | null>(null);
  const [loading, setLoading] = useState(false);
  const [pin, setPin] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function reset() {
    setCard(null);
    setPin("");
    setNote(null);
  }

  const loadCard = useCallback(async (serial: string) => {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch(
        `/api/staff/card?serial=${encodeURIComponent(serial)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok) setCard(data as CardState);
      else setNote({ ok: false, text: data.message ?? "Kortet blev ikke fundet." });
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse." });
    } finally {
      setLoading(false);
    }
  }, []);

  const onResult = useCallback(
    (text: string) => {
      // Kortets QR indeholder serienummeret direkte.
      const value = text.includes("/kort/")
        ? (text.split("/kort/")[1]?.split(/[/?#]/)[0] ?? text)
        : text.trim();
      setScanning(false);
      loadCard(value);
    },
    [loadCard],
  );

  async function giveStamp() {
    if (!card) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/staff/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ serial: card.serial }),
      });
      const data = await res.json();
      if (res.ok) {
        setNote({
          ok: true,
          text: data.rewardReady
            ? "Kortet er nu fuldt. Belønning klar."
            : `Stempel givet. ${data.stamps} af ${data.required}.`,
        });
        await loadCard(card.serial);
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke stemple." });
      }
    } finally {
      setBusy(false);
    }
  }

  async function redeem() {
    if (!card) return;
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
        setNote({ ok: true, text: "Belønning indløst. Kortet er nulstillet." });
        setPin("");
        await loadCard(card.serial);
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke indløse." });
        setPin("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      {!card && !loading ? (
        <button
          onClick={() => {
            setNote(null);
            setScanning(true);
          }}
          className={btnClass("moss", "lg")}
        >
          Scan kundens kort
        </button>
      ) : null}

      {loading ? (
        <p className="font-[200] text-[0.9rem] text-stone">Henter kort...</p>
      ) : null}

      {note && !card ? (
        <p
          className={cn(
            "font-[200] text-[0.85rem]",
            note.ok ? "text-moss" : "text-rust",
          )}
        >
          {note.text}
        </p>
      ) : null}

      {card ? (
        <div className="flex flex-col gap-5">
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

          {note ? (
            <p
              className={cn(
                "font-[200] text-[0.85rem]",
                note.ok ? "text-moss" : "text-ink",
              )}
            >
              {note.text}
            </p>
          ) : null}

          {card.rewardReady ? (
            <div className="flex flex-col gap-3 rounded-sm border border-moss bg-moss/5 p-5">
              <div>
                <p className="font-[300] text-[1rem] text-ink">Belønning klar</p>
                <p className="font-[200] text-[0.85rem] text-stone">
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
                  className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[200] tracking-[0.3em] text-ink outline-none focus:border-moss"
                />
              </label>
              <button
                onClick={redeem}
                disabled={busy || pin.length < 4}
                className={btnClass("moss") + " self-start"}
              >
                {busy ? "Indløser..." : "Indløs belønning"}
              </button>
            </div>
          ) : (
            <button
              onClick={giveStamp}
              disabled={busy}
              className={btnClass("primary")}
            >
              {busy ? "Et øjeblik..." : "Giv stempel"}
            </button>
          )}

          <button
            onClick={reset}
            className="self-start text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate hover:text-ink"
          >
            Scan nyt kort
          </button>
        </div>
      ) : null}

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
