"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#sådan", label: "Sådan virker det" },
  { href: "/#pris", label: "Pris" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      className="h-6 w-6"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
        solid
          ? "border-fog bg-parchment/95 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="font-[400] text-[1.05rem] tracking-[0.02em] text-ink"
          aria-label="Stemplet, til forsiden"
        >
          Stemplet<span className="text-moss">.</span>
        </Link>

        {/* Desktop: links + Log ind + CTA */}
        <div className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg font-[300] text-[0.78rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-lg font-[400] text-[0.78rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
          >
            Log ind
          </Link>
          <Link
            href="/start"
            className="inline-flex min-h-9 items-center rounded-full bg-ink px-4 text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-parchment transition-colors hover:bg-stone"
          >
            Kom gratis i gang
          </Link>
        </div>

        {/* Mobil: hamburger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Luk menu" : "Åbn menu"}
          aria-expanded={open}
          className="-mr-2 flex h-10 w-10 items-center justify-center rounded-lg text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 md:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobil-menu: links + Log ind + Kom gratis i gang */}
      {open ? (
        <div className="border-t border-fog bg-parchment/98 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex w-full max-w-[1100px] flex-col gap-1 px-6 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 font-[300] text-[0.92rem] text-ink transition-colors hover:bg-sand"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-3 font-[400] text-[0.92rem] text-ink transition-colors hover:bg-sand"
            >
              Log ind
            </Link>
            <Link
              href="/start"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-ink px-5 py-3.5 text-[0.78rem] font-[400] uppercase tracking-[0.08em] text-parchment transition-colors hover:bg-stone"
            >
              Kom gratis i gang
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
