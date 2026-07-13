"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/#sådan", label: "Sådan virker det" },
  { href: "/#pris", label: "Pris" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${
        scrolled
          ? "border-fog bg-parchment/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-6 md:px-8">
        <Link
          href="/"
          className="font-[400] text-[1.05rem] tracking-[0.02em] text-ink"
          aria-label="Stemplet, til forsiden"
        >
          Stemplet<span className="text-moss">.</span>
        </Link>

        <div className="flex items-center gap-5 md:gap-7">
          <nav className="hidden items-center gap-7 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg font-[300] text-[0.78rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/login"
            className="rounded-lg font-[400] text-[0.78rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
          >
            Log ind
          </Link>

          {/* Den primaere CTA skal altid kunne naas, ogsaa fra mobil-toppen. */}
          <Link
            href="/start"
            className="inline-flex min-h-9 items-center rounded-full bg-moss px-4 text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-parchment transition-colors hover:bg-moss-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment"
          >
            Kom gratis i gang
          </Link>
        </div>
      </div>
    </header>
  );
}
