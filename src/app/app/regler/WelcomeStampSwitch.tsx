"use client";

import { cn } from "@/lib/utils";
import { setWelcomeStampAction } from "./actions";
import { Toggle } from "./FeatureSwitch";

// "Første stempel med det samme": samme kontakt som funktionerne ovenfor, men
// uden bekraeftelse (intet forsvinder fra kundernes kort).
export function WelcomeStampSwitch({ on }: { on: boolean }) {
  return (
    <form
      action={setWelcomeStampAction}
      className={cn(
        "mb-6 flex items-center gap-4 rounded-[18px] border bg-white p-4 shadow-card transition-colors sm:p-5",
        on ? "border-fog" : "border-dashed border-clay",
      )}
    >
      <input type="hidden" name="on" value={on ? "0" : "1"} />
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]",
          on ? "bg-ink text-white" : "bg-[#F2F5F9] text-stone",
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v8M8 12h8" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[1.02rem] font-semibold tracking-[-0.01em] text-ink">Første stempel med det samme</span>
        <span className="block text-[0.86rem] leading-snug text-stone">
          Nye kunder får 1 stempel, når de henter kortet. Så er de i gang.
        </span>
      </span>
      <Toggle on={on} locked={false} />
    </form>
  );
}
