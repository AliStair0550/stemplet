"use client";

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
  const blocked = NO_TRACK.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (blocked) return null;
  return <GoogleAnalytics gaId={gaId} />;
}
