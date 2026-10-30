"use client";

import { useEffect, useState } from "react";
import { rgba } from "@/lib/brand";

// Del-knap (telefonens delemenu) og kopiér link til kundens henvisning.
export function ShareReferral({ text, url, fg, bg }: { text: string; url: string; fg: string; bg: string }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setCanShare(typeof navigator.share === "function"), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* kopiering afvist: koden staar stadig paa skaermen */
    }
  }
  async function share() {
    try {
      await navigator.share({ text, url });
    } catch {
      /* annulleret */
    }
  }

  const btn = "inline-flex min-h-12 flex-1 items-center justify-center rounded-full px-5 text-[0.95rem] font-semibold";
  return (
    <div className="flex w-full gap-2">
      {canShare ? (
        <button type="button" onClick={share} className={btn} style={{ background: fg, color: bg }}>
          Del
        </button>
      ) : null}
      <button
        type="button"
        onClick={copy}
        className={btn}
        style={canShare ? { border: `1px solid ${rgba(fg, 0.35)}`, color: fg } : { background: fg, color: bg }}
      >
        {copied ? "Kopieret" : "Kopiér link"}
      </button>
    </div>
  );
}
