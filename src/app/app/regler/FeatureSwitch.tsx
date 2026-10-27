"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";
import { setFeatureAction, type Feature } from "./actions";

// En funktion paa kortet med en til/fra-kontakt. Fra kraever en bekraeftelse,
// fordi kunderne mister funktionen paa deres kort (intet slettes dog).

function Toggle({ on, locked }: { on: boolean; locked: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      role="switch"
      aria-checked={on}
      disabled={pending || locked}
      title={locked ? "Kortet skal have mindst én funktion." : undefined}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed",
        on ? "bg-ink" : "bg-clay",
        pending && "opacity-60",
        locked && "opacity-50",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-[left]",
          on ? "left-[1.375rem]" : "left-0.5",
        )}
      />
      <span className="sr-only">{on ? "Slå fra" : "Slå til"}</span>
    </button>
  );
}

export function FeatureSwitch({
  feature,
  title,
  text,
  on,
  locked,
  offWarning,
  icon,
}: {
  feature: Feature;
  title: string;
  text: string;
  on: boolean;
  /** Den eneste funktion, der er slaaet til: kan ikke slaas fra. */
  locked: boolean;
  offWarning: string;
  icon: React.ReactNode;
}) {
  return (
    <form
      action={setFeatureAction}
      onSubmit={(e) => {
        if (on && !window.confirm(offWarning)) e.preventDefault();
      }}
      className={cn(
        "flex items-center gap-4 rounded-[18px] border bg-white p-4 shadow-card transition-colors sm:p-5",
        on ? "border-fog" : "border-dashed border-clay",
      )}
    >
      <input type="hidden" name="feature" value={feature} />
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
          on ? "bg-ink text-white" : "bg-[#f5f5f7] text-stone",
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          {icon}
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.02rem] font-semibold tracking-[-0.01em] text-ink">{title}</span>
        <span className="block text-[0.86rem] leading-snug text-stone">{text}</span>
      </span>
      <Toggle on={on} locked={on && locked} />
    </form>
  );
}
