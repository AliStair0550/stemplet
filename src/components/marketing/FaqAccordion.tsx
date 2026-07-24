"use client";

import { useState } from "react";

// Faelles FAQ-harmonika: eet spOrgsmaal aabent ad gangen, plus/minus-ikon og
// bloed udfoldning. Bruges baade paa forsiden og paa branchesiderne, saa de
// opfoerer sig ens. Svaret ligger ALTID i DOM'en (skjules kun med CSS), saa det
// stadig taeller for SEO og matcher FAQPage-strukturdata.
export function FaqAccordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="border-t border-fog">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className="border-b border-fog">
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-6 py-5 text-left"
            >
              <span className="font-[300] text-[1rem] leading-[1.4] text-ink">
                {f.q}
              </span>
              <span className="relative h-3.5 w-3.5 shrink-0">
                <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate" />
                <span
                  className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate transition-transform duration-300 ${
                    isOpen ? "scale-y-0" : "scale-y-100"
                  }`}
                />
              </span>
            </button>
            <div
              className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <p className="pb-6 pr-6 font-[200] text-[0.9rem] leading-[1.8] text-stone">
                  {f.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
