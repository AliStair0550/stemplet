"use client";

import { useState, useTransition } from "react";
import { CARD_NAME_MAX, claimCta } from "@/lib/card-name";
import { saveCardNameAction } from "./actions";

// Kortets navn: bruges i knappen, naar kunderne henter kortet paa butikssiden.
export function CardNameForm({
  initialName,
  autoName,
  primaryColor,
  textColor,
}: {
  initialName: string;
  autoName: string;
  primaryColor: string;
  textColor: string;
}) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(initialName);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = name !== saved;

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveCardNameAction(name);
      if (res.ok) {
        setSaved(name);
        setMsg({ ok: true, text: "Gemt" });
      } else setMsg({ ok: false, text: res.error });
    });
  }

  return (
    <section className="mb-6 rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
      <h3 className="text-[1.05rem] font-semibold text-ink">Kortets navn</h3>
      <p className="mt-1 text-[0.9rem] text-stone">Bruges i knappen, når kunderne henter kortet på din side.</p>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setMsg(null);
        }}
        maxLength={CARD_NAME_MAX}
        placeholder={autoName}
        aria-label="Kortets navn"
        className="mt-4 w-full rounded-xl border border-fog bg-[#F2F5F9] px-4 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-ink"
      />
      <p className="mt-2 text-[0.8rem] text-slate">
        Højst {CARD_NAME_MAX} tegn. Lad feltet stå tomt for at bruge &quot;{autoName}&quot;.
      </p>
      <div className="mt-4 flex justify-center rounded-[14px] bg-[#F2F5F9] p-4">
        <span
          className="flex min-h-11 items-center rounded-2xl px-6 text-[0.92rem] font-medium"
          style={{ background: textColor, color: primaryColor }}
        >
          {claimCta(name.trim() || autoName)}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending || !dirty}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-white hover:bg-[#0A2D5A] disabled:opacity-50"
        >
          {pending ? "Gemmer..." : "Gem navn"}
        </button>
        {msg ? <span className={`text-[0.85rem] ${msg.ok ? "text-ink" : "text-rust"}`}>{msg.text}</span> : null}
      </div>
    </section>
  );
}
