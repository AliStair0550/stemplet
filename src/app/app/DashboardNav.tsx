"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Plan } from "@prisma/client";
import { Wordmark } from "@/components/Wordmark";
import { signOutAction } from "./actions";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; proOnly?: boolean }[] = [
  { href: "/app", label: "Overblik" },
  { href: "/app/kort", label: "Design" },
  { href: "/app/kasse", label: "Stempel" },
  { href: "/app/guide", label: "Sådan virker det" },
  { href: "/app/kampagner", label: "Kampagner" },
  { href: "/app/statistik", label: "Statistik" },
  { href: "/app/materialer", label: "Materialer" },
  { href: "/app/integrationer", label: "Integrationer" },
  { href: "/app/indstillinger", label: "Indstillinger" },
];

export function DashboardNav({
  businessName,
  plan,
}: {
  businessName: string;
  plan: Plan;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-fog bg-sand/40 px-6 py-8 md:flex print:hidden">
        <Wordmark />
        <div className="mt-1 flex items-center gap-2">
          <span className="truncate text-[0.75rem] font-[200] text-slate">
            {businessName}
          </span>
          <PlanBadge plan={plan} />
        </div>

        <nav className="mt-10 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "px-3 py-2 text-[0.82rem] font-[300] tracking-[0.02em] transition-colors",
                isActive(l.href)
                  ? "bg-moss/10 text-moss"
                  : "text-stone hover:text-ink",
              )}
            >
              {l.label}
              {l.proOnly && plan !== "PRO" ? (
                <span className="ml-1.5 text-[0.6rem] uppercase tracking-[0.1em] text-clay">
                  Pro
                </span>
              ) : null}
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
          <div className="flex items-center gap-3">
            <PlanBadge plan={plan} />
            <form action={signOutAction}>
              <button className="text-[0.7rem] font-[300] uppercase tracking-[0.1em] text-slate">
                Log ud
              </button>
            </form>
          </div>
        </div>
        <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3.5 py-2 text-[0.8rem] font-[300] transition-colors",
                isActive(l.href)
                  ? "bg-moss/10 text-moss"
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

function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[0.6rem] font-[400] uppercase tracking-[0.1em]",
        plan === "PRO" ? "bg-moss text-parchment" : "bg-fog text-slate",
      )}
    >
      {plan === "PRO" ? "Pro" : "Gratis"}
    </span>
  );
}
