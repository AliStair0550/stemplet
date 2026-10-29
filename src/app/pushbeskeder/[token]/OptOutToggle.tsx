"use client";

import { useState, useTransition } from "react";
import { rgba } from "@/lib/brand";
import { setNewsOptOutAction } from "./actions";

export function OptOutToggle({ token, optedOut, shop, fg, bg }: { token: string; optedOut: boolean; shop: string; fg: string; bg: string }) {
  const [off, setOff] = useState(optedOut);
  const [error, setError] = useState(false);
  const [pending, start] = useTransition();

  function toggle() {
    setError(false);
    start(async () => {
      const res = await setNewsOptOutAction(token, !off);
      if (res.ok) setOff(!off);
      else setError(true);
    });
  }

  return (
    <>
      <p role="status" className="text-[0.95rem] font-[300] leading-relaxed" style={{ color: rgba(fg, 0.8) }}>
        {off
          ? `Du får ikke flere pushbeskeder fra ${shop}. Det kan tage et par minutter, før kortet i Wallet er opdateret.`
          : `Du får korte nyheder fra ${shop} på låseskærmen, fx om tilbud og åbningstider. Højst én om dagen.`}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium transition-transform active:scale-[0.98] disabled:opacity-60"
        style={{ backgroundColor: fg, color: bg }}
      >
        {pending ? "Gemmer..." : off ? "Slå pushbeskeder til igen" : "Slå pushbeskeder fra"}
      </button>
      {error ? (
        <p role="alert" className="text-[0.85rem] text-rust">
          Det lykkedes ikke. Prøv igen om lidt.
        </p>
      ) : null}
    </>
  );
}
