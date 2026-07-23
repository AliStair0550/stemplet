"use client";

import { useEffect, useState } from "react";

// iOS-only hint: viser butikken hvordan de foejer dashboardet til hjemmeskaermen,
// saa ikonet aabner direkte her (start_url /app). Vises kun i Safari paa iPhone/
// iPad, ikke naar det allerede koerer som hjemmeskaerm-app, og kan lukkes.
const DISMISS_KEY = "stemplet:homehint-dismissed";

export function AddToHomeHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ignore
    }
    const ua = navigator.userAgent || "";
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone ===
        true;
    if (isIOS && isSafari && !standalone) setShow(true);
  }, []);

  if (!show) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border border-terracotta/25 bg-terracotta/[0.05] px-4 py-3.5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mt-0.5 h-5 w-5 shrink-0 text-terracotta"
        aria-hidden
      >
        <path d="M12 15V4M8.5 7.5 12 4l3.5 3.5" />
        <path d="M7 11H6a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7a1 1 0 0 0-1-1h-1" />
      </svg>
      <div className="min-w-0 flex-1">
        <p className="text-[0.9rem] font-[500] text-ink">
          Få dashboardet på hjemmeskærmen
        </p>
        <p className="mt-0.5 text-[0.82rem] font-[300] leading-relaxed text-stone">
          Tryk på Del-knappen i Safari og vælg{" "}
          <span className="font-[500] text-ink">Føj til hjemmeskærm</span>. Så
          åbner ikonet direkte her i dashboardet.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Luk"
        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-slate transition-colors hover:text-ink"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  );
}
