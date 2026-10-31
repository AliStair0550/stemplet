"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rgba } from "@/lib/brand";
import { WalletIcon } from "@/components/ui";
import { markCardShared } from "../actions";

// Kundekortet til deling. Oeverst et udstillingskort i butikkens farver med
// QR-koden (det, man viser over disken), derunder linket til kundesiden.
// "Vis til kunden" aabner en fuldskaermsvisning i butikkens farver, holder
// skaermen taendt og skruer kontrasten op, saa koden scanner hurtigt.

export type Showcase = {
  shopName: string;
  logoUrl: string | null;
  headline: string;
  lines: string[];
  primaryColor: string;
  textColor: string;
};

type WakeLockLike = { release: () => Promise<void> };

function Brand({ s, size }: { s: Showcase; size: "sm" | "lg" }) {
  return s.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={s.logoUrl} alt={s.shopName} className={size === "lg" ? "h-12 w-auto max-w-[60vw] object-contain" : "h-9 w-auto max-w-[70%] object-contain"} />
  ) : (
    <span className={size === "lg" ? "text-[1.4rem] font-bold tracking-[-0.02em]" : "text-[1.05rem] font-bold tracking-[-0.02em]"}>{s.shopName}</span>
  );
}

function QrTile({ qrDataUrl, s, big }: { qrDataUrl: string; s: Showcase; big?: boolean }) {
  return (
    <div
      className={big ? "rounded-[32px] bg-white p-5" : "rounded-[22px] bg-white p-3.5"}
      style={{ boxShadow: `0 0 0 6px ${rgba(s.textColor, 0.18)}, 0 24px 60px -24px rgba(0,0,0,0.45)` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt={`QR-kode til ${s.shopName}s kundekort`}
        className={big ? "aspect-square w-[min(74vw,58vh,460px)]" : "aspect-square w-[min(56vw,200px)]"}
      />
    </div>
  );
}

export function KundekortShare({
  url,
  qrDataUrl,
  showcase: s,
  autoOpen = false,
  walletPassUrl = null,
}: {
  url: string;
  qrDataUrl: string;
  showcase: Showcase;
  /** Aabn fuld skaerm med det samme (fx "Vis QR-kode" paa Hjem). */
  autoOpen?: boolean;
  /** Butikkens eget QR-kort til ejerens Wallet. */
  walletPassUrl?: string | null;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(autoOpen);
  const [canShare, setCanShare] = useState(false);
  const wake = useRef<WakeLockLike | null>(null);
  const shown = url.replace(/^https?:\/\//, "");
  // Kom i gang: QR-koden vist eller linket delt taeller som "kortet er delt".
  const marked = useRef(false);
  const markShared = useCallback(() => {
    if (marked.current) return;
    marked.current = true;
    void markCardShared().catch(() => {});
  }, []);

  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  const close = useCallback(() => {
    setFull(false);
    void wake.current?.release().catch(() => {});
    wake.current = null;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    // Kom man direkte fra "Vis QR-kode", gaar luk tilbage dertil.
    if (autoOpen && window.history.length > 1) router.back();
  }, [autoOpen, router]);

  // Aabnet direkte: hold skaermen taendt med det samme.
  useEffect(() => {
    if (!autoOpen) return;
    markShared();
    const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockLike> } }).wakeLock;
    wl?.request("screen").then((l) => (wake.current = l)).catch(() => {});
  }, [autoOpen, markShared]);

  async function open() {
    setFull(true);
    markShared();
    // Hold skaermen taendt, mens koden vises (hvor browseren kan).
    try {
      const wl = (navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockLike> } }).wakeLock;
      if (wl) wake.current = await wl.request("screen");
    } catch {
      /* ikke understoettet: koden vises stadig */
    }
    // Rigtig fuld skaerm, hvor det findes (fx Android og computer).
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      /* iPhone: visningen fylder stadig hele skaermen */
    }
  }

  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [full, close]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      markShared();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* kopiering afvist: linket staar stadig paa skaermen */
    }
  }

  async function share() {
    try {
      await navigator.share({ title: s.shopName, text: s.headline, url });
      markShared();
    } catch {
      /* delingen blev annulleret */
    }
  }

  const btn = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[0.92rem] font-semibold";
  const glow = `radial-gradient(ellipse 90% 60% at 50% 0%, ${rgba(s.textColor, 0.16)} 0%, transparent 70%)`;

  return (
    <div className="flex flex-col gap-6">
      {/* Udstillingskortet: saadan ser det ud, naar du viser det til kunden. */}
      <section
        className="relative overflow-hidden rounded-[28px] px-6 pb-7 pt-8 text-center shadow-[0_30px_70px_-35px_rgba(6,28,61,0.55)] sm:px-10"
        style={{ background: `${glow}, ${s.primaryColor}`, color: s.textColor }}
      >
        <div className="flex flex-col items-center gap-5">
          <Brand s={s} size="sm" />
          <p className="max-w-sm text-[1.6rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-[1.9rem]">{s.headline}</p>
          <QrTile qrDataUrl={qrDataUrl} s={s} />
          {s.lines.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {s.lines.map((l) => (
                <span key={l} className="rounded-full px-3.5 py-1.5 text-[0.82rem] font-medium" style={{ background: rgba(s.textColor, 0.12) }}>
                  {l}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-1 flex flex-wrap justify-center gap-2">
            {/* Hurtigst ved kassen: QR-koden i ejerens egen Wallet. */}
            {walletPassUrl ? (
              <a href={walletPassUrl} className={`${btn} w-full sm:w-auto`} style={{ background: "#000", color: "#fff" }}>
                <WalletIcon />
                Føj til Apple Wallet
              </a>
            ) : null}
            <button
              type="button"
              onClick={open}
              className={btn}
              style={{ background: s.textColor, color: s.primaryColor }}
            >
              Vis til kunden
            </button>
            <a
              href={qrDataUrl}
              download={`${s.shopName}-qr.png`}
              className={btn}
              style={{ border: `1px solid ${rgba(s.textColor, 0.35)}`, color: s.textColor }}
            >
              Hent QR-kode
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
        <h3 className="text-[1.05rem] font-semibold text-ink">Link til kundesiden</h3>
        <p className="mt-1 text-[0.9rem] text-stone">Send det til kunderne, eller sæt det på din hjemmeside.</p>
        <p className="mt-4 truncate rounded-xl bg-[#F2F5F9] px-4 py-3 text-[0.95rem] text-ink">{shown}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={copy} className={`${btn} bg-ink text-white hover:bg-[#0A2D5A]`}>
            {copied ? "Kopieret" : "Kopiér link"}
          </button>
          {canShare ? (
            <button type="button" onClick={share} className={`${btn} border border-clay text-ink hover:border-ink`}>
              Del
            </button>
          ) : null}
          <a href={url} target="_blank" rel="noreferrer" className={`${btn} border border-clay text-ink hover:border-ink`}>
            Åbn kundesiden
          </a>
        </div>
      </section>

      {full ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR-kode til kunden"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-between overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] text-center"
          style={{ background: `${glow}, ${s.primaryColor}`, color: s.textColor }}
        >
          <div className="flex w-full items-center justify-between">
            <span className="w-11" aria-hidden />
            <Brand s={s} size="lg" />
            <button
              type="button"
              onClick={close}
              aria-label="Luk"
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ background: rgba(s.textColor, 0.14) }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5" aria-hidden>
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center gap-6 py-6">
            <p className="max-w-md text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[2.6rem]">Scan og hent dit kort</p>
            <QrTile qrDataUrl={qrDataUrl} s={s} big />
            {s.lines.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {s.lines.map((l) => (
                  <span key={l} className="rounded-full px-4 py-2 text-[1rem] font-medium" style={{ background: rgba(s.textColor, 0.12) }}>
                    {l}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          <p className="text-[0.9rem]" style={{ color: rgba(s.textColor, 0.7) }}>
            Åbn kameraet, og peg det på koden. Ingen app.
          </p>
        </div>
      ) : null}
    </div>
  );
}
