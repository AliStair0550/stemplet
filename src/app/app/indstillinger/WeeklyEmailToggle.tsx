"use client";

import { useState, useTransition } from "react";
import { setWeeklyEmail } from "../actions";

export function WeeklyEmailToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await setWeeklyEmail(next);
      if (!res.ok) setOn(!next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Ugentligt overblik"
      onClick={toggle}
      disabled={pending}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? "bg-moss" : "bg-clay"
      } disabled:opacity-60`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          on ? "translate-x-[1.375rem]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
