"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";
import { BusinessSwitcher } from "./BusinessSwitcher";
import { StempletLogo, HenvisningerLogo } from "@/components/ProductLogo";
import { cn } from "@/lib/utils";

// Dashboardets ramme med kundernes kort i centrum. Oeverst det faelles (Scan,
// Hjem, Kunder), saa DIT KORT: kortets design og funktionerne paa kortet med
// hvert sit logo og undermenu, og nederst butikkens egne ting. Et produkt, butikken ikke har, vises som "+", saa
// begge produkter altid er inden for et tryk.

type NavLink = { href: string; label: string };

const SCAN: NavLink = { href: "/app/kasse", label: "Scan" };
const COMMON: NavLink[] = [
  { href: "/app", label: "Hjem" },
  { href: "/app/kunder", label: "Kunder" },
];

const STEMPLET_LINKS: NavLink[] = [
  { href: "/app/stemplet", label: "Overblik" },
  { href: "/app/kort", label: "Regler" },
  { href: "/app/statistik", label: "Statistik" },
];

const HENVISNINGER_LINKS: NavLink[] = [
  { href: "/app/henvisninger", label: "Overblik" },
  { href: "/app/henvisninger/indstillinger", label: "Regler" },
  { href: "/app/henvisninger/statistik", label: "Statistik" },
];

// Kampagner hoerer til kunderne (velkomst, dobbelt-stempler m.m.), ikke til et
// enkelt produkt; de kraever dog stempler.
const CAMPAIGNS: NavLink = { href: "/app/kampagner", label: "Kampagner" };

// "Integrationer" (API/webhooks) og "Opsætning" (/app/kom-i-gang) er skjult fra
// menuen; siderne findes stadig paa adressen for den, der kender den.
const SHOP_LINKS: NavLink[] = [
  { href: "/app/indstillinger", label: "Butik og adgang" },
  { href: "/app/visitkort", label: "Visitkort" },
  { href: "/app/guide", label: "Guide til personalet" },
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

  // Overblik-sider matcher kun praecis; resten matcher ogsaa undersider.
  const exact = new Set(["/app", "/app/henvisninger"]);
  const isActive = (href: string) =>
    exact.has(href) ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  const inStemplet = STEMPLET_LINKS.some((l) => isActive(l.href));
  const inHenvisninger = pathname.startsWith("/app/henvisninger");

  const stemplet = showStamps ? (
    <ProductGroup
      logo={<StempletLogo className="text-[1.05rem]" />}
      href="/app/stemplet"
      open={inStemplet}
      links={STEMPLET_LINKS}
      isActive={isActive}
    />
  ) : (
    <AddProduct
      href="/app/stemplet/tilfoej"
      label="Tilføj Stemplet"
      active={pathname.startsWith("/app/stemplet")}
      logo={<StempletLogo className="text-[1.05rem]" />}
    />
  );
  const henvisninger = showReferrals ? (
    <ProductGroup
      logo={<HenvisningerLogo lines className="h-[1.35rem]" />}
      href="/app/henvisninger"
      open={inHenvisninger}
      links={HENVISNINGER_LINKS}
      isActive={isActive}
    />
  ) : (
    <AddProduct
      href="/app/henvisninger/tilfoej"
      label="Tilføj Henvisninger"
      active={inHenvisninger}
      logo={<HenvisningerLogo lines className="h-[1.35rem]" />}
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
      {cardLink(
        "/app/plakat",
        "Plakat",
        <>
          <rect x="5" y="3.5" width="14" height="17" rx="1.5" />
          <rect x="9" y="11" width="6" height="6" rx="0.8" />
          <path d="M8.5 7.5h7" />
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
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col overflow-y-auto border-r border-fog bg-[#f7f7f8] px-4 py-6 md:flex print:hidden">
        <BusinessSwitcher businesses={businesses} activeId={activeBusinessId} />

        <Link
          href={SCAN.href}
          className={cn(
            "mt-5 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[0.88rem] font-[500] text-parchment transition-colors",
            isActive(SCAN.href) ? "bg-black" : "bg-ink hover:bg-black",
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
                isActive(l.href) ? "bg-sand font-[500] text-ink" : "text-stone hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
          {showStamps ? (
            <Link
              href={CAMPAIGNS.href}
              className={cn(
                "ml-3 border-l border-fog py-1.5 pl-4 text-[0.82rem] transition-colors",
                isActive(CAMPAIGNS.href) ? "font-[500] text-ink" : "text-stone hover:text-ink",
              )}
            >
              {CAMPAIGNS.label}
            </Link>
          ) : null}

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
            className="max-h-full overflow-y-auto rounded-t-2xl border-t border-fog bg-white px-4 pb-5 pt-4 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            {showStamps ? (
              <Link
                href={CAMPAIGNS.href}
                className={cn(
                  "mb-3 flex rounded-lg px-3 py-2 text-[0.88rem] transition-colors",
                  isActive(CAMPAIGNS.href) ? "bg-sand font-[500] text-ink" : "text-ink hover:bg-sand/60",
                )}
              >
                Kampagner til dine kunder
              </Link>
            ) : null}
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
        <TabLink href="/app/kunder" label="Kunder" active={isActive("/app/kunder") || isActive(CAMPAIGNS.href)}>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.7 2.3 3 5" />
        </TabLink>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className={cn(
            "flex min-h-[3.75rem] flex-col items-center justify-center gap-1 text-[0.68rem]",
            moreOpen || (!isActive("/app") && !isActive(SCAN.href) && !isActive("/app/kunder") && !isActive(CAMPAIGNS.href))
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
