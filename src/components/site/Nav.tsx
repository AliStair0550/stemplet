"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";

const LINKS = [
  { href: "/hvorfor", label: "Fordele" },
  { href: "/#pris", label: "Pris" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      className="h-7 w-7"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <>
          <path d="M3.5 7h17" />
          <path d="M3.5 12h17" />
          <path d="M3.5 17h17" />
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
      <div className="mx-auto flex h-16 w-full max-w-[1120px] items-center justify-between px-6 md:px-8">
        <Wordmark href="/" className="text-[1.35rem]" />

        {/* Desktop: Fordele, Brancher, Pris + Log ind ved siden af primaer CTA */}
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full font-medium text-[0.9rem] text-taupe transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-full font-medium text-[0.9rem] text-taupe transition-colors hover:text-ink"
          >
            Log ind
          </Link>
          <Link
            href="/start"
            className="inline-flex min-h-10 items-center rounded-full bg-terracotta px-5 text-[0.9rem] font-medium text-parchment transition-colors hover:bg-terracotta-dark"
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
          className="-mr-2 -mt-0.5 flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 md:hidden"
        >
          <MenuIcon open={open} />
        </button>
      </div>

      {/* Mobil-menu: Fordele, Brancher, Pris + Log ind lige over primaer knap
          "Kom gratis i gang" */}
      {open ? (
        <div className="border-t border-ink/[0.08] bg-parchment/98 backdrop-blur-md md:hidden">
          <nav className="mx-auto flex w-full max-w-[1120px] flex-col gap-1 px-6 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-2 py-3 font-medium text-[0.95rem] text-ink transition-colors hover:bg-sand"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-2 py-3 font-medium text-[0.95rem] text-ink transition-colors hover:bg-sand"
            >
              Log ind
            </Link>
            <Link
              href="/start"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-terracotta px-5 py-3.5 text-[0.9rem] font-medium text-parchment transition-colors hover:bg-terracotta-dark"
            >
              Kom gratis i gang
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
