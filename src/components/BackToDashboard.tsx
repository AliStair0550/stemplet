"use client";

import { useEffect, useState } from "react";

// Dashboardet som app paa hjemmeskaermen (iPhone) aabner kundesiden i samme
// vindue uden browserens tilbage-knap. Kommer man fra dashboardet, viser vi en
// lille "Dashboard"-knap, saa man ikke sidder fast. Kunder ser den aldrig.
const FLAG = "folka_fra_dashboard";

/** Saettes af dashboardet, saa kundesiden ved, hvor man kom fra. */
export function MarkDashboardVisit() {
  useEffect(() => {
    try {
      sessionStorage.setItem(FLAG, "1");
    } catch {
      /* privat tilstand: knappen vises bare ikke */
    }
  }, []);
  return null;
}

export function BackToDashboard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    let fromDashboard = false;
    try {
      fromDashboard = sessionStorage.getItem(FLAG) === "1";
    } catch {
      /* ingen adgang: vis ikke */
    }
    setShow(standalone && fromDashboard);
  }, []);
  if (!show) return null;
  return (
    <a
      href="/app"
      className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-50 flex min-h-10 items-center gap-1.5 rounded-full border border-white/70 bg-white/80 py-2 pl-3 pr-4 text-[0.85rem] font-semibold text-[#061C3D] shadow-[0_6px_20px_-8px_rgba(6,28,61,0.4)] backdrop-blur-xl active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M15 18l-6-6 6-6" />
      </svg>
      Dashboard
    </a>
  );
}
