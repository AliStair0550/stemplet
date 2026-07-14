"use client";

import { useState, useTransition } from "react";
import { setSelfScan } from "../actions";

export function SelfScanToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await setSelfScan(next);
      if (!res.ok) setOn(!next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Selvbetjening: kunden scanner selv"
      onClick={toggle}
      disabled={pending}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-moss" : "bg-clay"
      } disabled:opacity-60`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
