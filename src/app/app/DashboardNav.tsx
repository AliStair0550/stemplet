"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";
import { BusinessSwitcher } from "./BusinessSwitcher";
import { KundekortMark } from "@/components/ProductLogo";
import { cn } from "@/lib/utils";

// Funktionerne paa kortet vises som almindelig tekst under Kundekort (Folka).
const featureLabel = (t: string) => <span className="text-[0.88rem] font-[500] text-ink">{t}</span>;

// Dashboardets ramme med kundernes kort i centrum. Oeverst det faelles (Scan,
// Hjem, Kunder), saa DIT KORT: kortets design og funktionerne paa kortet med
// hvert sit logo og undermenu, og nederst butikkens egne ting. Et produkt, butikken ikke har, vises som "+", saa
// begge produkter altid er inden for et tryk.

type NavLink = { href: string; label: string };

const SCAN: NavLink = { href: "/app/kasse", label: "Scan" };

const STEMPLET_LINKS: NavLink[] = [
  { href: "/app/stemplet", label: "Overblik" },
  { href: "/app/statistik", label: "Statistik" },
];

const HENVISNINGER_LINKS: NavLink[] = [
  { href: "/app/henvisninger", label: "Overblik" },
  { href: "/app/henvisninger/statistik", label: "Statistik" },
];

// Kommunikation: pushbeskeder, kampagner (kraever stempler) og senere nyhedsmail.
const COMMS: NavLink = { href: "/app/beskeder", label: "Kommunikation" };
const COMMON: NavLink[] = [{ href: "/app", label: "Hjem" }, COMMS, { href: "/app/kunder", label: "Kunder" }];

// "Integrationer" (API/webhooks) og "Opsætning" (/app/kom-i-gang) er skjult fra
// menuen; siderne findes stadig paa adressen for den, der kender den.
const SHOP_LINKS: NavLink[] = [
  { href: "/app/indstillinger", label: "Butik og adgang" },
  { href: "/app/plakat", label: "Plakat" },
  { href: "/app/visitkort", label: "Visitkort" },
  { href: "/app/guide", label: "Service" },
];
// "Pro-aftale" vises kun naar butikken er varslet (>=80) eller har godkendt.
const AGREEMENT_LINK: NavLink = { href: "/app/aftale", label: "Pro-aftale" };

function ScanIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className={className} aria-hidden>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10" />
    </svg>
  );
}

export function DashboardNav({
  businesses,
  activeBusinessId,
  showAgreement = false,
  showReferrals = false,
  showStamps = true,
}: {
  businesses: { id: string; name: string }[];
  activeBusinessId: string;
  showAgreement?: boolean;
  showReferrals?: boolean;
  /** Fra = kun Henvisninger: Stemplet vises som "+ Tilfoej". */
  showStamps?: boolean;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const shopLinks = showAgreement ? [...SHOP_LINKS, AGREEMENT_LINK] : SHOP_LINKS;

  // "Mere" lukkes, naar man navigerer.
  useEffect(() => setMoreOpen(false), [pathname]);
  // Arket opfoerer sig som en dialog: fokus flyttes ind, Escape lukker, og
  // fokus vender tilbage til knappen.
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMoreOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const btn = moreBtnRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      btn?.focus();
    };
  }, [moreOpen]);

  // Overblik-sider matcher kun praecis; resten matcher ogsaa undersider.
  const exact = new Set(["/app", "/app/henvisninger"]);
  const isActive = (href: string) =>
    exact.has(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const inStemplet = STEMPLET_LINKS.some((l) => isActive(l.href));
  const inHenvisninger = pathname.startsWith("/app/henvisninger");
  const inComms = isActive(COMMS.href) || isActive("/app/kampagner") || isActive("/app/nyhedsmail");

  const stemplet = showStamps ? (
    <ProductGroup
      logo={featureLabel("Stempler")}
      href="/app/stemplet"
      open={inStemplet}
      links={STEMPLET_LINKS}
      isActive={isActive}
    />
  ) : (
    <AddProduct
      href="/app/stemplet/tilfoej"
      label="Tilføj stempler"
      active={pathname.startsWith("/app/stemplet")}
      logo={featureLabel("Stempler")}
    />
  );
  const henvisninger = showReferrals ? (
    <ProductGroup
      logo={featureLabel("Henvisninger")}
      href="/app/henvisninger"
      open={inHenvisninger}
      links={HENVISNINGER_LINKS}
      isActive={isActive}
    />
  ) : (
    <AddProduct
      href="/app/henvisninger/tilfoej"
      label="Tilføj henvisninger"
      active={inHenvisninger}
      logo={featureLabel("Henvisninger")}
    />
  );
  // Det aktive produkt foerst, tilvalget ("+") nedenunder.
  const products = showStamps ? (
    <>
      {stemplet}
      {henvisninger}
    </>
  ) : (
    <>
      {henvisninger}
      {stemplet}
    </>
  );

  // Dit kort: designet og reglerne, faelles for alle funktioner paa kortet.
  const cardLink = (href: string, label: string, icon: React.ReactNode) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.88rem] transition-colors",
        isActive(href) ? "bg-sand font-[500] text-ink" : "text-ink hover:bg-sand/60",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="h-4 w-4" aria-hidden>
        {icon}
      </svg>
      {label}
    </Link>
  );
  const designLink = (
    <>
      {cardLink(
        "/app/kortet",
        "Design",
        <>
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <path d="M3.5 9.5h17" />
        </>,
      )}
      {cardLink(
        "/app/regler",
        "Regler",
        <>
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </>,
      )}
      <p className="mx-3 mb-1 mt-3 text-[0.66rem] uppercase tracking-[0.14em] text-slate">Funktioner</p>
    </>
  );

  const shop = shopLinks.map((l) => (
    <Link
      key={l.href}
      href={l.href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-[0.8rem] transition-colors",
        isActive(l.href) ? "text-ink" : "text-stone hover:text-ink",
      )}
    >
      {l.label}
    </Link>
  ));

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto border-r border-fog bg-white px-4 py-6 md:flex print:hidden">
        <Link href="/app" aria-label="Kundekort, til Hjem" className="mb-5 px-2">
          <KundekortMark />
        </Link>
        <BusinessSwitcher businesses={businesses} activeId={activeBusinessId} />

        <Link
          href={SCAN.href}
          className={cn(
            "mt-5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.88rem] font-[500] text-parchment transition-colors",
            isActive(SCAN.href) ? "bg-[#0A2D5A]" : "bg-ink hover:bg-[#0A2D5A]",
          )}
        >
          <ScanIcon />
          {SCAN.label}
        </Link>

        <nav className="mt-4 flex flex-col gap-0.5">
          {COMMON.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.86rem] transition-colors",
                (l.href === COMMS.href ? inComms : isActive(l.href)) ? "bg-sand font-[500] text-ink" : "text-stone hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}

          {/* Dit kort: design og regler oeverst, derunder funktionerne paa kortet. */}
          <p className="mx-3 mb-1.5 mt-6 text-[0.66rem] uppercase tracking-[0.14em] text-slate">Dit kort</p>
          {designLink}
          {products}
        </nav>

        <div className="mt-auto flex flex-col gap-0.5 border-t border-fog pt-4">
          {shop}
          <form action={signOutAction}>
            <button className="px-3 py-1.5 text-[0.8rem] text-stone hover:text-ink">Log ud</button>
          </form>
        </div>
      </aside>

      {/* Mobil: butik oeverst, faner i bunden */}
      <div className="sticky top-0 z-30 border-b border-fog bg-parchment/95 px-5 py-3 backdrop-blur-md md:hidden print:hidden">
        <BusinessSwitcher businesses={businesses} activeId={activeBusinessId} />
      </div>

      {moreOpen ? (
        <div className="fixed inset-x-0 bottom-[4.25rem] top-0 z-40 flex flex-col justify-end bg-ink/20 md:hidden" onClick={() => setMoreOpen(false)}>
          <div
            ref={sheetRef}
            id="mere-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Mere"
            className="max-h-full overflow-y-auto rounded-t-2xl border-t border-fog bg-white px-4 pb-5 pt-4 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            {[
              { ...COMMS, label: "Kommunikation" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "mb-1 flex rounded-lg px-3 py-2 text-[0.88rem] transition-colors",
                  (l.href === COMMS.href ? inComms : isActive(l.href)) ? "bg-sand font-[500] text-ink" : "text-ink hover:bg-sand/60",
                )}
              >
                {l.label}
              </Link>
            ))}
            <p className="mx-3 mb-1.5 text-[0.66rem] uppercase tracking-[0.14em] text-slate">Dit kort</p>
            {designLink}
            {products}
            <div className="mt-4 flex flex-col gap-0.5 border-t border-fog pt-3">
              {shop}
              <form action={signOutAction}>
                <button className="px-3 py-1.5 text-[0.8rem] text-stone hover:text-ink">Log ud</button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Hovedmenu"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-fog bg-white pb-[env(safe-area-inset-bottom)] md:hidden print:hidden"
      >
        <TabLink href="/app" label="Hjem" active={isActive("/app")}>
          <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
        </TabLink>
        <TabLink href={SCAN.href} label="Scan" active={isActive(SCAN.href)}>
          <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10" />
        </TabLink>
        <TabLink href="/app/kunder" label="Kunder" active={isActive("/app/kunder")}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.7 2.3 3 5" />
        </TabLink>
        <button
          ref={moreBtnRef}
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          aria-controls="mere-menu"
          className={cn(
            "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.68rem]",
            moreOpen || (!isActive("/app") && !isActive(SCAN.href) && !isActive("/app/kunder"))
              ? "font-[500] text-ink"
              : "text-slate",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="h-[1.35rem] w-[1.35rem]" aria-hidden>
            <circle cx="5" cy="12" r="1.3" />
            <circle cx="12" cy="12" r="1.3" />
            <circle cx="19" cy="12" r="1.3" />
          </svg>
          Mere
        </button>
      </nav>
    </>
  );
}

// Et produkt, butikken ikke har endnu: nedtonet logo og "+", der fører til
// siden, hvor det slaas til.
function AddProduct({
  href,
  label,
  active,
  logo,
}: {
  href: string;
  label: string;
  active: boolean;
  logo: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 transition-colors",
        active ? "bg-sand" : "hover:bg-sand/60",
      )}
    >
      <span className="opacity-45">{logo}</span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full border border-clay text-[0.95rem] leading-none text-stone">
        +
      </span>
    </Link>
  );
}

function ProductGroup({
  logo,
  href,
  open,
  links,
  isActive,
}: {
  logo: React.ReactNode;
  href: string;
  open: boolean;
  links: NavLink[];
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="flex flex-col">
      <Link
        href={href}
        className={cn("flex items-center rounded-lg px-3 py-2 transition-colors", open ? "bg-sand" : "hover:bg-sand/60")}
      >
        {logo}
      </Link>
      {open ? (
        <div className="mb-1 ml-3 mt-0.5 flex flex-col border-l border-fog pl-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "py-1.5 text-[0.82rem] transition-colors",
                isActive(l.href) ? "font-[500] text-ink" : "text-slate hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TabLink({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.68rem]",
        active ? "font-[500] text-ink" : "text-slate",
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[1.35rem] w-[1.35rem]" aria-hidden>
        {children}
      </svg>
      {label}
    </Link>
  );
}
