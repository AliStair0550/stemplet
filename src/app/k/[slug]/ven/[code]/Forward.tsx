"use client";

import { useEffect } from "react";

// Sender videre til butikkens side med koden. Siden her findes kun for at give
// link-forhaandsvisningen (titel og billede) gaven til vennen.
export function Forward({ href }: { href: string }) {
  useEffect(() => {
    window.location.replace(href);
  }, [href]);
  return null;
}
