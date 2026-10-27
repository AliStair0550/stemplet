"use client";

import { useEffect, useRef, useState } from "react";

// Forsidens eneste bevaegelse (docs/henvisninger.md): fade og en let opadglidning,
// naar en sektion kommer ind, under 300 ms. Alt er synligt fra serveren; kun det,
// der ligger under folden ved indlaesning, skjules og glider ind. Reduceret
// bevaegelse springer animationen over.
export function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setState("hidden");
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setState("shown");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={
        state === "static"
          ? undefined
          : {
              opacity: state === "shown" ? 1 : 0,
              transform: state === "shown" ? "none" : "translateY(12px)",
              transition: "opacity 280ms ease-out, transform 280ms ease-out",
            }
      }
    >
      {children}
    </div>
  );
}
