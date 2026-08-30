"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";

// Ruter hvor selve URL'en baerer noget, Google ikke skal se:
//   /kort/<serienummer>  kortholderens eget kort-id
//   /s/<token>           engangs-token til deling
//   /kasse?kode=...      parringskode til kassen (en adgangsnoegle)
// Paa dem indlaeses gtag slet ikke, saa vaerdien aldrig kan havne i page_location
// eller i et event. Butikkens offentlige side (/k/<slug>) er ikke personhenfoerbar
// og maales som normalt.
const NO_TRACK = ["/kort", "/s", "/kasse"];

export function Analytics({ gaId }: { gaId: string }) {
  const pathname = usePathname() ?? "";
  // Udskyd det tunge gtag-script til browseren er i tomgang (efter foerste
  // maling/interaktiv), saa det ikke konkurrerer om hovedtraaden og forsinker
  // LCP paa mobil. SPA-sidevisninger fanges stadig, naar det er indlaest.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as typeof window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setReady(true), { timeout: 3000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(() => setReady(true), 2500);
    return () => clearTimeout(id);
  }, []);

  const blocked = NO_TRACK.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (blocked || !ready) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
