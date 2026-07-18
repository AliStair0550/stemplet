"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Ved skift af rute springes der STRAKS til toppen. Uden dette bliver man
// haengende nederst (fx i footeren), mens siden langsomt scroller op, fordi
// html'en har scroll-behavior: smooth. Anker-links (#...) roeres ikke, saa deres
// bloede scroll paa samme side bevares.
export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.location.hash) return;
    // Slaa smooth fra et oejeblik, saa spring til toppen er oejeblikkeligt.
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    html.style.scrollBehavior = prev;
  }, [pathname]);
  return null;
}
