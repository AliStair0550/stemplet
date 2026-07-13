"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Scanner } from "@/components/Scanner";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { hexToRgb, type StampIconKey } from "@/lib/brand";

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

// ── Fuldskaerm (hvor browseren understoetter det: Android/desktop) ────
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
      /* fuldskaerm er valgfrit; PWA-standalone giver det paa iOS */
    }
  }
}

function exitFullscreen() {
  try {
    if (document.fullscreenElement) document.exitFullscreen?.();
  } catch {
    /* ligegyldigt hvis det ikke kan lade sig goere */
  }
}

// ── Wake Lock: hold skaermen vaagen, mens kiosken er aaben ────────────
// Gen-tager laasen naar skaermen har vaeret skjult (fx efter et notifikations-
// panel), for browseren slipper den automatisk. Er API'et ikke tilgaengeligt
// (aeldre iOS), er faldback at butikken saetter Auto-laas til Aldrig.
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
      // Forny lidt foer udloeb, saa koden aldrig naar at blive ugyldig.
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

  // Start / stop
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

  // Nedtaelling pr. sekund (kun til visning)
  useEffect(() => {
    if (!active) return;
    const id = setInterval(
      () => setSeconds((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => clearInterval(id);
  }, [active]);

  // Reconnect: hent straks igen naar nettet er tilbage eller skaermen ses igen.
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

// ── Top: dashboard-indgang + kiosk-overlay ────────────────────────────
export function Kassemodus({ card }: { card: KioskCard }) {
  const [open, setOpen] = useState(false);

  // Startes appen fra hjemmeskaermen (standalone), aabnes kiosken med det
  // samme, saa ikonet lander direkte i kassen uden browser-krom.
  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) setOpen(true);
  }, []);

  const openKiosk = () => {
    enterFullscreen();
    setOpen(true);
  };
  const closeKiosk = () => {
    exitFullscreen();
    setOpen(false);
  };

  return (
    <>
      <KioskEntry onOpen={openKiosk} />
      {open ? <KioskShell card={card} onClose={closeKiosk} /> : null}
    </>
  );
}

function KioskEntry({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-fog bg-white p-8 md:p-10">
        <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between md:gap-10">
          <div className="max-w-md">
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-moss">
              Kassemodus
            </span>
            <h2 className="mt-2 font-[300] text-[1.5rem] leading-tight text-ink">
              Én skærm, hele kassen.
            </h2>
            <p className="mt-3 font-[300] text-[0.9rem] leading-relaxed text-stone">
              Fuldskærm med din roterende stempel-QR og én stor knap til at
              scanne kundens kort. Stil en iPad på disken og lad den stå:
              skærmen holdes vågen, og efter hver scanning går den selv tilbage
              til QR-koden.
            </p>
          </div>
          <button onClick={onOpen} className={btnClass("moss", "lg")}>
            Åbn kassemodus
          </button>
        </div>
      </div>
      <InstallHint />
    </div>
  );
}

function InstallHint() {
  return (
    <details className="group rounded-lg border border-fog bg-sand/60 p-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-[400] text-[0.9rem] text-ink">
        Læg kassen på hjemmeskærmen (anbefales)
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0 text-slate transition-transform group-open:rotate-180"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <ol className="mt-5 flex flex-col gap-3 border-t border-fog pt-5">
        {[
          "Åbn denne side i Safari på iPad'en (eller Chrome på Android).",
          "Tryk på Del-ikonet og vælg Læg på hjemmeskærm.",
          "Åbn Stemplet-ikonet: kassen starter direkte i fuldskærm uden browser.",
          "iPad: sæt Auto-lås til Aldrig under Indstillinger, Skærm og lysstyrke, så skærmen aldrig slukker.",
        ].map((t, i) => (
          <li key={i} className="flex gap-3">
            <span className="font-fraunces text-[0.95rem] font-light italic text-moss">
              {i + 1}
            </span>
            <span className="font-[300] text-[0.86rem] leading-relaxed text-stone">
              {t}
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}

// ── Kiosk-overlay: styrer visning, wake lock og inaktivitet ───────────
type View = "qr" | "scan" | "card";

function KioskShell({
  card,
  onClose,
}: {
  card: KioskCard;
  onClose: () => void;
}) {
  const [view, setView] = useState<View>("qr");
  const [serial, setSerial] = useState<string | null>(null);
  const { qr, seconds, offline } = useKioskToken(true);
  useWakeLock(true);

  const backToQr = useCallback(() => {
    setView("qr");
    setSerial(null);
  }, []);

  // Escape lukker kiosken.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Laas baggrundens scroll, saa man ikke kan glide ud af kiosken.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 30 sek. uden berøring i scan/kort -> selv tilbage til QR.
  useEffect(() => {
    if (view === "qr") return;
    let t: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(t);
      t = setTimeout(backToQr, 30000);
    };
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    reset();
    events.forEach((e) =>
      window.addEventListener(e, reset, { passive: true }),
    );
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [view, backToQr]);

  return (
    <div
      className="fixed inset-0 z-[120] overflow-hidden"
      style={{ background: card.primaryColor, color: card.textColor }}
    >
      {view === "qr" ? (
        <KioskQr
          card={card}
          qr={qr}
          seconds={seconds}
          offline={offline}
          onScan={() => setView("scan")}
          onClose={onClose}
        />
      ) : null}

      {view === "card" && serial ? (
        <KioskStaffCard
          serial={serial}
          onRescan={() => {
            setSerial(null);
            setView("scan");
          }}
          onExit={backToQr}
        />
      ) : null}

      {view === "scan" ? (
        <Scanner
          overlayClassName="z-[130]"
          hint="Ret kameraet mod QR-koden på kundens kort."
          onClose={backToQr}
          onResult={(text) => {
            const value = text.includes("/kort/")
              ? (text.split("/kort/")[1]?.split(/[/?#]/)[0] ?? text)
              : text.trim();
            setSerial(value);
            setView("card");
          }}
        />
      ) : null}
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

// ── QR-visning: standardtilstanden i kiosken ──────────────────────────
function KioskQr({
  card,
  qr,
  seconds,
  offline,
  onScan,
  onClose,
}: {
  card: KioskCard;
  qr: string | null;
  seconds: number;
  offline: boolean;
  onScan: () => void;
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

      <button
        onClick={onScan}
        className="flex min-h-16 w-full max-w-lg items-center justify-center gap-3 rounded-full text-[1.1rem] font-[400] tracking-[0.02em] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)] transition-transform active:scale-[0.98]"
        style={{ background: card.textColor, color: card.primaryColor }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
        >
          <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M4 12h16" />
        </svg>
        Scan kundens kort
      </button>
    </div>
  );
}

// ── Kort-visning: personalet giver stempel eller indløser ─────────────
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

function KioskStaffCard({
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
  const [pin, setPin] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadCard = useCallback(async (s: string) => {
    setLoading(true);
    setNote(null);
    try {
      const res = await fetch(
        `/api/staff/card?serial=${encodeURIComponent(s)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok) setCard(data as CardState);
      else {
        setCard(null);
        setNote({ ok: false, text: data.message ?? "Kortet blev ikke fundet." });
      }
    } catch {
      setCard(null);
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCard(serial);
  }, [serial, loadCard]);

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
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
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
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6">
      <div className="flex w-full max-w-md flex-col gap-5 rounded-[1.6rem] bg-parchment p-6 text-ink shadow-[0_30px_80px_-24px_rgba(0,0,0,0.5)]">
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="h-10 w-10 animate-pulse rounded-full bg-moss/15" />
            <p className="font-[300] text-[0.9rem] text-stone">Henter kort...</p>
          </div>
        ) : card ? (
          <>
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
                  <p className="font-[400] text-[1rem] text-ink">
                    Belønning klar
                  </p>
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
                    aria-describedby="kiosk-pin-hint"
                    className="w-40 border border-clay bg-white px-4 py-2.5 font-[300] tracking-[0.3em] text-ink outline-none focus:border-moss"
                  />
                  <span
                    id="kiosk-pin-hint"
                    className="text-[0.72rem] font-[300] text-slate"
                  >
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
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <p className="font-[400] text-[1rem] text-ink">
              Kortet blev ikke fundet
            </p>
            {note ? (
              <p className="font-[300] text-[0.88rem] text-rust">{note.text}</p>
            ) : null}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 border-t border-fog pt-4">
          <button
            onClick={onRescan}
            className="text-[0.72rem] font-[400] uppercase tracking-[0.1em] text-moss transition-colors hover:text-moss-light"
          >
            Scan nyt kort
          </button>
          <button
            onClick={onExit}
            className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
          >
            Tilbage til QR
          </button>
        </div>
      </div>
    </div>
  );
}
