"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { signOutAction } from "./actions";
import { cn } from "@/lib/utils";

// "Stempel" (kassen) er dagens primaere handling og loeftes bevidst ud fra de
// oevrige menupunkter, saa det staar tydeligt for sig selv.
const STAMP_LINK = { href: "/app/kasse", label: "Stempel" };

const LINKS: { href: string; label: string }[] = [
  { href: "/app", label: "Overblik" },
  { href: "/app/kom-i-gang", label: "Kom i gang" },
  { href: "/app/statistik", label: "Statistik" },
  { href: "/app/kampagner", label: "Kampagner" },
  { href: "/app/kort", label: "Design" },
  { href: "/app/materialer", label: "Materialer" },
  { href: "/app/guide", label: "Guide til personalet" },
  { href: "/app/indstillinger", label: "Indstillinger" },
];

// Tydeligt flueben med en linje-kant nedenunder (som et stempel, der lander).
function StampGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M4.5 11.5l4.2 4.2L19 5.5" strokeWidth={2.6} />
      <path d="M4 20.5h16" strokeWidth={1.6} />
    </svg>
  );
}
// "Integrationer" (API/webhooks) er skjult fra menuen til efter kundetesten.
// Siden findes stadig paa /app/integrationer for den, der kender adressen.
// "Pro-aftale" vises kun naar butikken er varslet (>=80) eller har godkendt.
const AGREEMENT_LINK = { href: "/app/aftale", label: "Pro-aftale" };

export function DashboardNav({
  businessName,
  showAgreement = false,
}: {
  businessName: string;
  showAgreement?: boolean;
}) {
  const pathname = usePathname();
  const links = showAgreement ? [...LINKS, AGREEMENT_LINK] : LINKS;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-fog bg-sand/40 px-6 py-8 md:flex print:hidden">
        <Wordmark />
        <span className="mt-1 block truncate text-[0.75rem] font-[300] text-stone">
          {businessName}
        </span>

        <nav className="mt-9 flex flex-col gap-1">
          {/* Stempel: dagens primaere handling, som en tydelig knap for sig selv */}
          <Link
            href={STAMP_LINK.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-[0.85rem] font-[400] tracking-[0.01em] transition-colors",
              isActive(STAMP_LINK.href)
                ? "border-terracotta bg-terracotta text-parchment shadow-[0_8px_22px_-10px_rgba(166,80,46,0.7)]"
                : "border-terracotta/25 bg-terracotta/[0.06] text-terracotta hover:bg-terracotta/[0.11]",
            )}
          >
            <StampGlyph className="h-[1.05rem] w-[1.05rem]" />
            {STAMP_LINK.label}
          </Link>

          {/* Hårfin adskillelse til de oevrige (administrations)punkter */}
          <div className="my-3 h-px bg-fog" aria-hidden />

          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.82rem] font-[300] tracking-[0.02em] transition-colors",
                isActive(l.href)
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-stone hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <form action={signOutAction} className="mt-auto">
          <button className="text-[0.72rem] font-[300] uppercase tracking-[0.12em] text-slate hover:text-ink">
            Log ud
          </button>
        </form>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 border-b border-fog bg-parchment/95 backdrop-blur-md md:hidden print:hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <Wordmark />
          <form action={signOutAction}>
            <button className="text-[0.7rem] font-[300] uppercase tracking-[0.1em] text-slate">
              Log ud
            </button>
          </form>
        </div>
        <div className="relative">
          <nav className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-4 pb-3">
            {/* Stempel: loeftet ud som en tydelig knap foerst i raekken */}
            <Link
              href={STAMP_LINK.href}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[0.8rem] font-[400] transition-colors",
                isActive(STAMP_LINK.href)
                  ? "border-terracotta bg-terracotta text-parchment"
                  : "border-terracotta/30 bg-terracotta/[0.08] text-terracotta",
              )}
            >
              <StampGlyph className="h-4 w-4" />
              {STAMP_LINK.label}
            </Link>

            {/* Lodret hårstreg, der skiller Stempel fra de oevrige punkter */}
            <span
              aria-hidden
              className="mx-0.5 h-6 w-px shrink-0 self-center bg-clay"
            />

            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-full px-3.5 text-[0.8rem] font-[300] transition-colors",
                  isActive(l.href)
                    ? "bg-terracotta/10 text-terracotta"
                    : "text-stone hover:text-ink",
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          {/* BlOd fade i hoejre kant, saa det er tydeligt at menuen kan scrolles. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-parchment to-transparent"
          />
        </div>
      </div>
    </>
  );
}
