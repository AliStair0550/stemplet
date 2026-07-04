"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Holder en server-renderet side frisk: opdaterer roligt mens fanen er synlig,
// saa kunden ser stempler lande live uden at genindlaese.
export function LiveRefresh({ intervalMs = 6000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [router, intervalMs]);
  return null;
}
