"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/Wordmark";
import { signOutAction } from "./actions";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string }[] = [
  { href: "/app", label: "Overblik" },
  { href: "/app/kasse", label: "Stempel" },
  { href: "/app/statistik", label: "Statistik" },
  { href: "/app/kampagner", label: "Kampagner" },
  { href: "/app/kort", label: "Design" },
  { href: "/app/materialer", label: "Materialer" },
  { href: "/app/guide", label: "Sådan virker det" },
  { href: "/app/indstillinger", label: "Indstillinger" },
];
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
        <span className="mt-1 block truncate text-[0.75rem] font-[200] text-slate">
          {businessName}
        </span>

        <nav className="mt-10 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 text-[0.82rem] font-[300] tracking-[0.02em] transition-colors",
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
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-[0.8rem] font-[300] transition-colors",
                isActive(l.href)
                  ? "bg-terracotta/10 text-terracotta"
                  : "text-stone hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
