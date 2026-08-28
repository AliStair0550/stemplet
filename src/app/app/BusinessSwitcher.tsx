"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { switchBusiness } from "./actions";

type Biz = { id: string; name: string };

// Butik-skifter i menuen: en agentur-bruger (medlem af flere butikker) kan hoppe
// mellem sine butikker uden nyt login. Skiftet saetter en verificeret cookie
// (switchBusiness) og genindlaeser. Er man kun medlem af een butik, vises blot
// navnet.
export function BusinessSwitcher({
  businesses,
  activeId,
}: {
  businesses: Biz[];
  activeId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const active = businesses.find((b) => b.id === activeId) ?? businesses[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: string) {
    setOpen(false);
    if (id === activeId) return;
    start(async () => {
      const res = await switchBusiness(id);
      if (res.ok) router.refresh();
    });
  }

  return (
    <div className="relative mt-1.5" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-fog bg-white px-2.5 py-1.5 text-left text-[0.78rem] font-[400] text-ink transition-colors hover:border-clay disabled:opacity-60"
      >
        <span className="truncate">{pending ? "Skifter..." : active?.name}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-3.5 w-3.5 shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-40 mt-1 overflow-hidden rounded-lg border border-fog bg-white shadow-lift">
          <ul role="listbox" className="max-h-72 overflow-y-auto py-1">
            {businesses.map((b) => {
              const on = b.id === activeId;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => choose(b.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8rem] transition-colors hover:bg-sand/50 ${
                      on ? "font-[500] text-ink" : "font-[300] text-stone"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{b.name}</span>
                    {on ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5 shrink-0 text-terracotta"
                        aria-hidden
                      >
                        <path d="M5 12.5l4.5 4.5L19 6" />
                      </svg>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link
            href="/app/ny-butik"
            className="flex items-center gap-2 border-t border-fog px-3 py-2.5 text-[0.78rem] font-[400] text-terracotta transition-colors hover:bg-sand/50"
            onClick={() => setOpen(false)}
          >
            <span className="text-[1rem] leading-none">+</span>
            Opret ny butik
          </Link>
        </div>
      ) : null}
    </div>
  );
}
