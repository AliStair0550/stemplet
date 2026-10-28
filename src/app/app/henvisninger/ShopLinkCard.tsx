"use client";

import { useState } from "react";

// Butikkens henvisningsside: linket, butikken saetter paa sin hjemmeside og sine
// sociale medier. Derfra kan kunder henvise og venner taste en kode.
export function ShopLinkCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <section className="mb-8 rounded-2xl border border-fog bg-white px-5 py-4 shadow-card">
      <p className="text-[0.95rem] font-[600] text-ink">Din henvisningsside</p>
      <p className="mt-0.5 text-[0.85rem] text-stone">
        Sæt linket på din hjemmeside, Instagram og Facebook. Her kan kunderne henvise, og venner kan taste en kode.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="min-w-0 flex-1 truncate rounded-full bg-[#F5F5F4] px-4 py-2.5 text-[0.9rem] text-ink">{shown}</span>
        <span className="flex gap-2">
          {/* Aabn er hovedknappen: butikken skal se siden, kunderne ser. */}
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-[#061C3D] px-6 text-[0.9rem] font-[600] text-white transition-transform active:scale-[0.97] sm:flex-none"
          >
            Åbn
          </a>
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
            className="min-h-11 flex-1 rounded-full border border-clay px-5 text-[0.9rem] font-[500] text-ink hover:border-ink sm:flex-none"
          >
            {copied ? "Kopieret" : "Kopiér link"}
          </button>
        </span>
      </div>
    </section>
  );
}
