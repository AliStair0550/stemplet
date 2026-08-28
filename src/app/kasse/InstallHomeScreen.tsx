"use client";

import { useEffect, useRef, useState } from "react";

// beforeinstallprompt findes ikke i lib.dom endnu, saa vi typer det smalt selv.
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// "Føj til hjemmeskærm" for kassen. Paa Android/Chrome bruger vi den rigtige
// install-prompt (som via /kasse's eget manifest aabner direkte i kassen). Paa
// iOS findes ingen prompt, saa vi viser den korte Del-vejledning i stedet.
// Skjules helt, naar siden allerede koerer som installeret app (standalone).
export function InstallHomeScreen() {
  const deferredRef = useRef<InstallPromptEvent | null>(null);
  const [canPrompt, setCanPrompt] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const sa =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(!!sa);

    const ua = navigator.userAgent || "";
    // iPad med iPadOS melder sig som Mac, saa vi tjekker ogsaa touch.
    const ios =
      /iphone|ipad|ipod/i.test(ua) ||
      (/Macintosh/i.test(ua) && "ontouchend" in document);
    setIsIos(ios);

    const onBIP = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as InstallPromptEvent;
      setCanPrompt(true);
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setCanPrompt(false);
      setStandalone(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Allerede installeret: ingen knap. Og hverken prompt (Android) eller iOS:
  // browseren kan ikke laegge den paa hjemmeskaermen, saa vi viser intet.
  if (standalone) return null;
  if (!canPrompt && !isIos) return null;

  async function onClick() {
    const deferred = deferredRef.current;
    if (deferred) {
      await deferred.prompt();
      try {
        await deferred.userChoice;
      } catch {
        /* ligegyldigt */
      }
      deferredRef.current = null;
      setCanPrompt(false);
      return;
    }
    // iOS: ingen prompt, vis vejledningen.
    setShowIosHelp((v) => !v);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 text-[0.68rem] font-[400] uppercase tracking-[0.1em] text-terracotta transition-opacity hover:opacity-70"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M12 8.5v7M8.5 12h7" />
        </svg>
        Føj til hjemmeskærm
      </button>

      {showIosHelp ? (
        <>
          {/* Klik udenfor lukker vejledningen */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowIosHelp(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-fog bg-white p-4 text-left shadow-card">
            <p className="font-[400] text-[0.82rem] text-ink">
              Føj kassen til hjemmeskærmen
            </p>
            <ol className="mt-2 flex flex-col gap-1.5 font-[300] text-[0.8rem] leading-relaxed text-stone">
              <li>
                1. Tryk på Del-ikonet{" "}
                <span className="inline-flex translate-y-0.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5 text-terracotta"
                  >
                    <path d="M12 3v12M8 7l4-4 4 4" />
                    <path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" />
                  </svg>
                </span>{" "}
                i browserens linje.
              </li>
              <li>2. Vælg &quot;Føj til hjemmeskærm&quot;.</li>
              <li>3. Tryk &quot;Tilføj&quot;. Nu åbner ikonet kassen direkte.</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              className="mt-3 text-[0.7rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Luk
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
