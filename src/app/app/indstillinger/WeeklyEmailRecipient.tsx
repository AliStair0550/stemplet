"use client";

import { useState, useTransition } from "react";
import { setWeeklyEmailTo } from "../actions";

export function WeeklyEmailRecipient({
  initial,
  emails,
}: {
  initial: string | null;
  emails: string[];
}) {
  // Peger valget paa en mail, der ikke laengere findes (fjernet), behandles det
  // som "alle".
  const [value, setValue] = useState(
    initial && emails.includes(initial) ? initial : "",
  );
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange(next: string) {
    const prev = value;
    setValue(next);
    setSaved(false);
    setError(null);
    start(async () => {
      const res = await setWeeklyEmailTo(next || null);
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setValue(prev);
        setError(res.error ?? "Kunne ikke gemme.");
      }
    });
  }

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
        Send ugemailen til
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={pending}
        className="w-full max-w-sm border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-terracotta disabled:opacity-60"
      >
        <option value="">Alle med login-adgang</option>
        {emails.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>
      <span className="text-[0.72rem] font-[300] leading-relaxed">
        {error ? (
          <span className="text-rust">{error}</span>
        ) : saved ? (
          <span className="text-terracotta">Gemt</span>
        ) : (
          <span className="text-slate">
            Vælg én mail, eller send til alle med login-adgang.
          </span>
        )}
      </span>
    </label>
  );
}
