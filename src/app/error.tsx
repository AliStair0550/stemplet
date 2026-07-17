"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { btnClass } from "@/components/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log lokalt (Sentry er slaaet fra i udvikling) og rapportér i produktion,
    // saa vi opdager fejl kunderne rammer, foer de skriver til os.
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-7 bg-parchment px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clay/40 text-stone">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <path d="M12 9v4M12 17h.01" />
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
        </svg>
      </span>
      <div className="flex flex-col items-center gap-2.5">
        <h1 className="font-[300] text-[1.6rem] tracking-[0.01em] text-ink">
          Noget gik galt
        </h1>
        <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
          Vi kunne ikke vise siden lige nu. Prøv igen, det er som regel
          forbigående.
        </p>
      </div>
      <button onClick={reset} className={btnClass("primary")}>
        Prøv igen
      </button>
    </main>
  );
}
