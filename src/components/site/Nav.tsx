"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui";

const LINKS = [
  { href: "#sådan", label: "Sådan virker det" },
  { href: "#pris", label: "Pris" },
  { href: "/login", label: "Log ind" },
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

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-[300] text-[0.78rem] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
          <ButtonLink href="/start" variant="primary">
            Kom gratis i gang
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
