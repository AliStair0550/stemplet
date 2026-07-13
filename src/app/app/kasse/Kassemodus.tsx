"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Scanner } from "@/components/Scanner";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { StampIcon } from "@/components/StampIcon";
import type { StampIconKey } from "@/lib/brand";

type Tab = "stempel" | "scan";

export type KioskCard = {
  businessName: string;
  logoUrl: string | null;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  rewardText: string;
  stampsRequired: number;
};

export function Kassemodus({ card }: { card: KioskCard }) {
  const [tab, setTab] = useState<Tab>("stempel");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex w-full gap-1 rounded-lg border border-fog bg-white p-1 sm:w-auto sm:self-start">
        {(
          [
            ["stempel", "Stempel-QR"],
            ["scan", "Scan kort"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={cn(
              "flex min-h-12 flex-1 items-center justify-center rounded-md px-5 text-[0.9rem] font-[300] tracking-[0.02em] transition-colors sm:flex-none",
              tab === key
                ? "bg-moss text-parchment"
                : "bg-sand text-stone hover:text-ink",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="-mt-4 max-w-md text-[0.8rem] font-[300] leading-relaxed text-slate">
        {tab === "stempel"
          ? "Vis denne skærm til kunden. De scanner QR-koden med deres eget kamera og får stemplet selv."
          : "Brug kameraet til at scanne kundens kort, når du selv vil give et stempel eller indløse en belønning."}
      </p>

      {tab === "stempel" ? <StempelQr card={card} /> : <ScanMode />}
    </div>
  );
}

// ── Roterende stempel-QR til kundens kamera ──────────────────────────

function StempelQr({ card }: { card: KioskCard }) {
  const [qr, setQr] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [kiosk, setKiosk] = useState(false);
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

  // Laas siden bag kiosk-visningen, saa man bliver paa den.
  useEffect(() => {
    if (!kiosk) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [kiosk]);

  return (
    <>
      <div className="flex flex-col items-center gap-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-5 rounded-2xl border border-fog bg-white p-8 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-moss">
              Scan og saml stempler
            </span>
            <span className="font-[300] text-[1.05rem] text-ink">
              {card.businessName}
            </span>
          </div>
          {error ? (
            <p className="flex h-[min(64vw,260px)] w-[min(64vw,260px)] items-center justify-center text-center font-[300] text-[0.9rem] text-stone">
              {error}
            </p>
          ) : qr ? (
            <Image
              src={qr}
              alt="Stempel-QR"
              width={300}
              height={300}
              className="h-[min(64vw,260px)] w-[min(64vw,260px)]"
              unoptimized
              priority
            />
          ) : (
            <div className="h-[min(64vw,260px)] w-[min(64vw,260px)] animate-pulse rounded-lg bg-fog" />
          )}
          <p className="text-[0.8rem] font-[300] text-slate">
            Ny kode om {seconds} sek.
          </p>
        </div>

        <button
          onClick={() => setKiosk(true)}
          className={btnClass("moss", "md")}
        >
          Vis i fuldskærm
        </button>
        <p className="max-w-md text-center font-[300] text-[0.85rem] leading-relaxed text-stone">
          Stil enheden ved disken. Koden skifter hvert minut, så et foto af
          skærmen er værdiløst bagefter.
        </p>
      </div>

      {kiosk ? (
        <KioskView
          card={card}
          qr={qr}
          seconds={seconds}
          onClose={() => setKiosk(false)}
        />
      ) : null}
    </>
  );
}

// ── Fuldskaerms kiosk-visning i butikkens eget brand ─────────────────
// Ren CSS-overlay (ikke Fullscreen-API'et), saa den ogsaa virker paa iPhone
// og bliver staaende, indtil man selv lukker den.

function KioskView({
  card,
  qr,
  seconds,
  onClose,
}: {
  card: KioskCard;
  qr: string | null;
  seconds: number;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-center gap-8 px-6 py-10"
      style={{ background: card.primaryColor, color: card.textColor }}
    >
      <button
        onClick={onClose}
        aria-label="Luk fuldskærm"
        className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full opacity-70 transition-opacity hover:opacity-100"
        style={{ border: `1px solid ${card.textColor}` }}
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

      <span className="font-[300] text-[1.6rem] tracking-[0.01em]">
        {card.businessName}
      </span>

      <div className="rounded-3xl bg-white p-6 shadow-[0_30px_80px_-24px_rgba(0,0,0,0.45)]">
        {qr ? (
          <Image
            src={qr}
            alt="Stempel-QR"
            width={420}
            height={420}
            className="h-[min(66vw,380px)] w-[min(66vw,380px)]"
            unoptimized
            priority
          />
        ) : (
          <div className="h-[min(66vw,380px)] w-[min(66vw,380px)] animate-pulse rounded-xl bg-fog" />
        )}
      </div>

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 opacity-40">
          {Array.from({ length: 4 }).map((_, i) => (
            <StampIcon key={i} icon={card.stampIcon} className="h-5 w-5" />
          ))}
        </div>
        <p className="font-[300] text-[1.5rem] leading-tight">
          Scan og saml stempler
        </p>
        <p className="text-[1.05rem] font-[300]" style={{ opacity: 0.85 }}>
          {card.stampsRequired} stempler, og så: {card.rewardText}
        </p>
      </div>

      <p className="text-[0.8rem] font-[300]" style={{ opacity: 0.55 }}>
        Ny kode om {seconds} sek.
      </p>
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
      {/* Tom tilstand: en indbydende invitation til at scanne */}
      {!card && !loading ? (
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-fog bg-white p-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss/10 text-moss">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
            >
              <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" />
            </svg>
          </span>
          <div>
            <p className="font-[400] text-[1.1rem] text-ink">
              Scan kundens kort
            </p>
            <p className="mx-auto mt-1.5 max-w-xs font-[300] text-[0.85rem] leading-relaxed text-stone">
              Ret kameraet mod QR-koden på kundens kort. Så kan du give stempler
              eller indløse en belønning.
            </p>
          </div>
          <button
            onClick={() => {
              setNote(null);
              setScanning(true);
            }}
            className={btnClass("moss", "lg")}
          >
            Åbn kamera
          </button>
          {note ? (
            <p
              className={cn(
                "font-[300] text-[0.85rem]",
                note.ok ? "text-moss" : "text-rust",
              )}
            >
              {note.text}
            </p>
          ) : null}
        </div>
      ) : null}

      {loading ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-fog bg-white p-10">
          <div className="h-10 w-10 animate-pulse rounded-full bg-moss/15" />
          <p className="font-[300] text-[0.9rem] text-stone">Henter kort...</p>
        </div>
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
                "text-center font-[300] text-[0.9rem]",
                note.ok ? "text-moss" : "text-rust",
              )}
            >
              {note.text}
            </p>
          ) : null}

          {card.rewardReady ? (
            <div className="flex flex-col gap-3 rounded-lg border border-moss bg-moss/5 p-5">
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
                  aria-describedby="pin-hint"
                  className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[300] tracking-[0.3em] text-ink outline-none focus:border-moss"
                />
                <span id="pin-hint" className="text-[0.72rem] font-[300] text-slate">
                  Indtast 4 til 6 cifre.
                </span>
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
              className={btnClass("moss", "lg")}
            >
              {busy
                ? "Et øjeblik..."
                : `Giv stempel (${card.stamps} af ${card.required})`}
            </button>
          )}

          <button
            onClick={reset}
            className="mx-auto text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
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
