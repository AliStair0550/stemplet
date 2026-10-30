"use client";

import { useEffect, useState } from "react";

// Kundekortet til deling: stor QR-kode, som kunden kan scanne direkte fra
// skaermen, og linket til kundesiden (kopiér, del, aabn). "Vis i fuld skærm"
// goer QR-koden stor nok til at scanne over disken.
export function KundekortShare({ url, qrDataUrl, shopName }: { url: string; qrDataUrl: string; shopName: string }) {
  const [copied, setCopied] = useState(false);
  const [full, setFull] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const shown = url.replace(/^https?:\/\//, "");

  useEffect(() => setCanShare(typeof navigator.share === "function"), []);
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* kopiering afvist: linket staar stadig paa skaermen */
    }
  }

  async function share() {
    try {
      await navigator.share({ title: shopName, text: `Hent dit kort hos ${shopName}`, url });
    } catch {
      /* delingen blev annulleret */
    }
  }

  const btn = "inline-flex min-h-11 items-center justify-center rounded-full px-5 text-[0.92rem] font-semibold";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
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

      <section className="flex flex-col items-center gap-3 rounded-[18px] border border-fog bg-white p-5 shadow-card">
        <h3 className="self-start text-[1.05rem] font-semibold text-ink">QR-kode</h3>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR-kode til ${shopName}s kundekort`} className="w-full max-w-[220px]" />
        <div className="flex w-full flex-col gap-2">
          <button type="button" onClick={() => setFull(true)} className={`${btn} bg-ink text-white hover:bg-[#0A2D5A]`}>
            Vis til kunden
          </button>
          <a href={qrDataUrl} download={`${shopName}-qr.png`} className={`${btn} border border-clay text-ink hover:border-ink`}>
            Hent QR-kode
          </a>
        </div>
      </section>

      {full ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="QR-kode til kunden"
          onClick={() => setFull(false)}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6"
        >
          <p className="text-center text-[1.6rem] font-bold tracking-[-0.03em] text-ink">Scan og hent dit kort</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="" className="aspect-square w-full max-w-[min(80vw,70vh)]" />
          <p className="text-[1rem] text-stone">{shopName}</p>
          <button type="button" onClick={() => setFull(false)} className={`${btn} border border-clay text-ink`}>
            Luk
          </button>
        </div>
      ) : null}
    </div>
  );
}
