"use client";

import { useEffect, useState } from "react";
import { btnClass } from "@/components/ui";

// "Føj til hjemmeskærm": paa Android/desktop hvor browseren tilbyder en
// installations-prompt, udloeser knappen den direkte. Paa iPhone/iPad (hvor det
// ikke kan udloeses programmatisk) folder den en kort vejledning ud. Skjules helt,
// naar appen allerede koerer fra hjemmeskaermen.
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function AddToHomeButton() {
  const [deferred, setDeferred] = useState<InstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    setStandalone(isStandalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPrompt);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone || installed) return null;

  async function onClick() {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setShowHint((v) => !v);
  }

  return (
    <div className="rounded-lg border border-fog bg-sand/30 p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
              <path d="M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="font-[400] text-[0.95rem] text-ink">
              Få Stemplet på hjemmeskærmen
            </p>
            <p className="font-[300] text-[0.8rem] leading-relaxed text-stone">
              Så åbner du dit dashboard med ét tryk, som en app.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClick}
          aria-expanded={!deferred && showHint}
          className={`${btnClass("outline")} shrink-0`}
        >
          Føj til hjemmeskærm
        </button>
      </div>
      {showHint ? (
        <p className="mt-4 border-t border-fog pt-4 font-[300] text-[0.82rem] leading-relaxed text-stone">
          På iPhone: tryk på{" "}
          <span className="font-[500] text-ink">Del-knappen</span> nederst i
          Safari, og vælg{" "}
          <span className="font-[500] text-ink">Føj til hjemmeskærm</span>. På
          computer: åbn browserens menu og vælg Installer.
        </p>
      ) : null}
    </div>
  );
}
