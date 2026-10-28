"use client";

import Link from "next/link";
import { useState } from "react";

// Sådan kommer kunderne til stempelkortet: QR-koden ved kassen og linket paa
// hjemmesiden. Instagram og Facebook aabner links i deres egen browser, hvor
// kortet ikke kan laegges i Wallet, saa dem fraraader vi som primaer kanal.
// Moerk flade for kontrast paa den lyse side (Alis oenske). Bruger faste farver
// (ikke text-ink m.fl.), saa dashboardets lyse stil ikke overstyrer dem.
export function StampShareCard({ url, qrDataUrl }: { url: string; qrDataUrl: string }) {
  const [copied, setCopied] = useState(false);
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <section className="mb-10 grid gap-7 rounded-[22px] bg-[#111] p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.5)] sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
      <div className="min-w-0">
        <p className="text-[1.6rem] font-bold leading-tight tracking-[-0.03em]">Del dit stempelkort.</p>
        <p className="mt-2 text-[0.98rem] text-white/65">
          Hæng QR-koden op ved kassen, og sæt linket på din hjemmeside. Kunderne henter kortet på få sekunder.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="min-w-0 flex-1 truncate rounded-full bg-white/10 px-4 py-2.5 text-[0.92rem] text-white">{shown}</span>
          <span className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  // Kopiering afvist: linket kan stadig markeres.
                }
              }}
              className="min-h-11 flex-1 rounded-full bg-white px-5 text-[0.92rem] font-[600] text-[#111] transition-transform active:scale-[0.97] sm:flex-none"
            >
              {copied ? "Kopieret" : "Kopiér link"}
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center rounded-full border border-white/25 px-5 text-[0.92rem] font-[500] text-white hover:border-white sm:flex-none"
            >
              Åbn
            </a>
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[0.9rem]">
          <Link href="/app/plakat" className="font-[500] text-white underline underline-offset-4">
            Lav en plakat
          </Link>
          {/* PDF-download (en fil, ikke en side), derfor <a download>. */}
          <a href="/api/qr-print/visitkort" download className="font-[500] text-white underline underline-offset-4">
            Download visitkort
          </a>
        </div>
        <p className="mt-5 text-[0.82rem] leading-relaxed text-white/45">
          Instagram og Facebook åbner links i deres egen browser, hvor kortet ikke kan lægges i Wallet. Brug derfor
          hjemmesiden og QR-koden.
        </p>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrDataUrl} alt="QR-kode til dit stempelkort" className="mx-auto h-40 w-40 rounded-[18px] bg-white p-3 sm:h-44 sm:w-44" />
    </section>
  );
}
