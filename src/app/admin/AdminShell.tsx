import Link from "next/link";
import { LockButton } from "./AdminControls";

// Faelles ramme for admin-arbejdsomraadet: sidehoved + faner. Bruges af alle tre
// faner (Platform-overblik, Marketing, Statistik), saa navigation og hoved er ens.
type Tab = "overblik" | "marketing" | "statistik";

const TABS: { key: Tab; href: string; label: string }[] = [
  { key: "overblik", href: "/admin", label: "Platform-overblik" },
  { key: "marketing", href: "/admin/marketing", label: "Marketing" },
  { key: "statistik", href: "/admin/statistik", label: "Statistik" },
];

export function AdminShell({
  admin,
  codeLock,
  active,
  children,
}: {
  admin: string;
  codeLock: boolean;
  active: Tab;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="mx-auto max-w-5xl">
        {/* Sidehoved */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[300] text-[1.6rem] tracking-[0.02em] text-ink">
              Arbejdsområde
            </h1>
            <p className="mt-1 font-[300] text-[0.85rem] text-slate">
              Logget ind som {admin}
            </p>
          </div>
          <div className="flex items-center gap-5">
            {codeLock ? <LockButton /> : null}
            <Link
              href="/app"
              className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Til dashboard
            </Link>
          </div>
        </div>

        {/* Faner */}
        <nav className="mt-7 flex gap-1 border-b border-fog">
          {TABS.map((t) => {
            const on = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                aria-current={on ? "page" : undefined}
                className={[
                  "-mb-px border-b-2 px-4 py-2.5 text-[0.85rem] transition-colors",
                  on
                    ? "border-terracotta font-[500] text-ink"
                    : "border-transparent font-[400] text-slate hover:text-ink",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8">{children}</div>
      </div>
    </main>
  );
}
