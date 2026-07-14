"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";

// Henter og monterer foerst en komponent, naar man scroller naer den. Komponentens
// JavaScript ligger i sin egen chunk (code-split via import()), saa den IKKE er en
// del af forsidens initiale bundle. Det holder foerste load let paa mobil; de
// tunge, animerede under-fold-sektioner hentes progressivt, mens man scroller.
export function LazyOnView({
  load,
  minHeight,
  id,
  className,
}: {
  load: () => Promise<{ default: ComponentType }>;
  minHeight: number;
  // id/className paa selve wrapperen, saa fx anker-links (#saadan) stadig virker,
  // ogsaa foer sektionen er hentet.
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [Comp, setComp] = useState<ComponentType | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Naar reduceret bevaegelse: hent stadig, men uden at vente paa scroll (godt
    // for skaermlaesere/hurtig print). Ellers: hent lidt FOER den ses (rootMargin).
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          io.disconnect();
          load().then((m) => setComp(() => m.default));
        }
      },
      { rootMargin: "500px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [load]);

  return (
    <div
      ref={ref}
      id={id}
      className={className}
      style={Comp ? undefined : { minHeight }}
    >
      {Comp ? <Comp /> : null}
    </div>
  );
}
