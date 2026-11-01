"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "./actions";
import { BusinessSwitcher } from "./BusinessSwitcher";
import { MarkDashboardVisit } from "@/components/BackToDashboard";
import { KundekortMark } from "@/components/ProductLogo";
import { cn } from "@/lib/utils";
import { PLATFORM } from "@/lib/platform";

// Funktionerne paa kortet vises som Design og Regler: ikon og almindelig tekst.
const FEATURE_ICONS: Record<string, React.ReactNode> = {
  Stempler: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.6-5" />
    </>
  ),
  Henvisninger: (
    <>
      <circle cx="8" cy="9" r="3" />
      <circle cx="17" cy="10" r="2.5" />
      <path d="M2.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5M14.5 15.2c.8-.5 1.6-.7 2.5-.7 2.2 0 3.8 1.3 4.5 3.8" />
    </>
  ),
};
const featureLabel = (t: string) => (
  <span className="flex items-center gap-2.5 text-[0.88rem] text-ink">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" className="h-4 w-4" aria-hidden>
      {FEATURE_ICONS[t]}
    </svg>
    {t}
  </span>
);

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

// Kommunikation: pushbeskeder, kampagner (kraever stempler) og tilbud.
const COMMS: NavLink = { href: "/app/beskeder", label: "Kommunikation" };
const COMMON: NavLink[] = [{ href: "/app", label: "Hjem" }, { href: "/app/kunder", label: "Kunder" }, COMMS];

// Fanerne i bunden paa mobil, i den raekkefoelge de staar. Kunder (kartoteket)
// ligger i Menu; det daglige sker paa Hjem og Scan.
const TABS = ["/app", "/app/kasse", "/app/beskeder", "menu"] as const;
type Tab = (typeof TABS)[number];

// "Integrationer" (API/webhooks) er skjult fra
// menuen; siderne findes stadig paa adressen for den, der kender den.
const SHOP_LINKS: NavLink[] = [
  { href: "/app/plakat", label: "Plakat" },
  { href: "/app/visitkort", label: "Visitkort" },
  { href: "/app/medarbejdere", label: "Medarbejdere" },
  { href: "/app/indstillinger", label: "Indstillinger" },
];
// "Ring til os": et tryk ringer op. (Personaleguiden paa /app/guide er skjult
// fra menuen, til den er enklere.)
const CALL_HREF = `tel:${PLATFORM.supportPhone.replace(/\s/g, "")}`;
const CALL_LINK: NavLink = { href: CALL_HREF, label: "Ring til os" };
// "Abonnement": de gratis maaneder, prisen og bekraeftelsen.
const AGREEMENT_LINK: NavLink = { href: "/app/aftale", label: "Abonnement" };

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
  canCreateBusiness = false,
}: {
  businesses: { id: string; name: string }[];
  activeBusinessId: string;
  /** Kun superadmin ser "Opret ny butik". */
  canCreateBusiness?: boolean;
  showAgreement?: boolean;
  showReferrals?: boolean;
  /** Fra = kun Henvisninger: Stemplet vises som "+ Tilfoej". */
  showStamps?: boolean;
}) {
  const pathname = usePathname();
  // Menu-arket: "closing" spiller animationen ned, foer arket fjernes.
  const [sheet, setSheet] = useState<"closed" | "open" | "closing">("closed");
  const moreOpen = sheet === "open";
  const setMoreOpen = (open: boolean) =>
    setSheet((s) => (open ? "open" : s === "open" ? "closing" : s));
  // Fanen lyser op med det samme ved tryk, foer den nye side er hentet, saa
  // telefonen foeles hurtig. Nulstilles, naar siden faktisk skifter.
  const [tapped, setTapped] = useState<string | null>(null);
  const shopLinks = [...SHOP_LINKS, ...(showAgreement ? [AGREEMENT_LINK] : []), CALL_LINK];

  // Menuen lukkes, naar man navigerer (ogsaa via tilbage-knappen).
  useEffect(() => {
    setSheet((s) => (s === "open" ? "closing" : s));
    setTapped(null);
  }, [pathname]);
  // Arket fjernes efter animationen ned. Sikkerhedsnet, hvis animationen ikke
  // melder sig faerdig (fx en fane i baggrunden).
  useEffect(() => {
    if (sheet !== "closing") return;
    const t = window.setTimeout(() => setSheet((s) => (s === "closing" ? "closed" : s)), 400);
    return () => window.clearTimeout(t);
  }, [sheet]);
  // Siden bagved staar stille, mens menuen er aaben (ingen scroll igennem).
  useEffect(() => {
    if (!moreOpen) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [moreOpen]);
  // Arket opfoerer sig som en dialog: fokus flyttes ind, Escape lukker, og
  // fokus vender tilbage til knappen.
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!moreOpen) return;
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheet("closing");
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
  const inComms = isActive(COMMS.href) || isActive("/app/kampagner") || isActive("/app/tilbud");
  // Den fane, der lyser: det man lige har trykket paa (foer siden er hentet),
  // ellers siden man staar paa. Alt uden egen fane hoerer under Menu.
  const tabOf = (href: string): Tab =>
    (TABS as readonly string[]).includes(href) ? (href as Tab) : "menu";
  const pageTab: Tab = isActive("/app")
    ? "/app"
    : isActive(SCAN.href)
      ? "/app/kasse"
      : inComms
        ? "/app/beskeder"
        : "menu";
  const activeTab: Tab = moreOpen ? "menu" : tapped ? tabOf(tapped) : pageTab;
  // Tryk i arket: luk det med det samme og lad Menu lyse, mens siden hentes.
  const onSheetTap = (href: string) => {
    setTapped(href);
    setSheet("closing");
  };

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
        <Link href="/app" aria-label="Folka Kort, til Hjem" className="mb-5 px-2">
          <KundekortMark />
        </Link>
        <BusinessSwitcher businesses={businesses} activeId={activeBusinessId} canCreate={canCreateBusiness} />

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

      <MarkDashboardVisit />
      {/* Mobil: butik oeverst, faner i bunden */}
      <div className="sticky top-0 z-30 border-b border-fog bg-parchment px-5 py-3 md:hidden print:hidden">
        <BusinessSwitcher businesses={businesses} activeId={activeBusinessId} canCreate={canCreateBusiness} />
      </div>

      {sheet !== "closed" ? (
        <div
          className={cn(
            "fixed inset-0 z-40 flex flex-col justify-end bg-ink/25 md:hidden",
            sheet === "closing" ? "sheet-backdrop-out" : "sheet-backdrop",
          )}
          onClick={() => setSheet("closing")}
        >
          <div
            ref={sheetRef}
            id="menu-ark"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className={cn(
              "max-h-full overflow-y-auto overscroll-contain rounded-t-[28px] border-t border-fog bg-white px-3 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-2.5 shadow-lift",
              sheet === "closing" ? "sheet-panel-out" : "sheet-panel",
            )}
            onClick={(e) => e.stopPropagation()}
            onAnimationEnd={(e) => {
              if (e.target === e.currentTarget && sheet === "closing") setSheet("closed");
            }}
          >
            <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-fog" aria-hidden />
            <SheetLink href="/app/kunder" label="Kunder" active={isActive("/app/kunder")} onTap={onSheetTap} icon={ICONS.customers} />
            <SheetSection title="Dit kort">
              <SheetLink href="/app/kortet" label="Design" active={isActive("/app/kortet")} onTap={onSheetTap} icon={ICONS.design} />
              <SheetLink href="/app/regler" label="Regler" active={isActive("/app/regler")} onTap={onSheetTap} icon={ICONS.rules} />
            </SheetSection>
            <SheetSection title="Funktioner">
              {(showStamps ? [true, false] : [false, true]).map((stamps) =>
                stamps ? (
                  <SheetLink
                    key="stempler"
                    href={showStamps ? "/app/stemplet" : "/app/stemplet/tilfoej"}
                    label={showStamps ? "Stempler" : "Tilføj stempler"}
                    active={pathname.startsWith("/app/stemplet")}
                    onTap={onSheetTap}
                    icon={FEATURE_ICONS.Stempler}
                    muted={!showStamps}
                    extra={showStamps ? { href: "/app/statistik", label: "Statistik", active: isActive("/app/statistik") } : undefined}
                  />
                ) : (
                  <SheetLink
                    key="henvisninger"
                    href={showReferrals ? "/app/henvisninger" : "/app/henvisninger/tilfoej"}
                    label={showReferrals ? "Henvisninger" : "Tilføj henvisninger"}
                    active={inHenvisninger && !isActive("/app/henvisninger/statistik")}
                    onTap={onSheetTap}
                    icon={FEATURE_ICONS.Henvisninger}
                    muted={!showReferrals}
                    extra={
                      showReferrals
                        ? { href: "/app/henvisninger/statistik", label: "Statistik", active: isActive("/app/henvisninger/statistik") }
                        : undefined
                    }
                  />
                ),
              )}
            </SheetSection>
            <SheetSection title="Butik">
              {shopLinks.map((l) => (
                <SheetLink key={l.href} href={l.href} label={l.label} active={isActive(l.href)} onTap={onSheetTap} icon={ICONS[l.href]} />
              ))}
            </SheetSection>
            <form action={signOutAction} className="mt-2">
              <button className="flex min-h-11 w-full items-center rounded-2xl px-3 text-[0.9rem] text-stone transition-colors active:bg-sand">
                Log ud
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <nav
        aria-label="Hovedmenu"
        // Svaevende glasbjaelke som paa iPhone. Fast, let graa tone, saa glasset
        // ser ens ud, uanset om der ligger et moerkt kort eller en hvid side bag.
        className="fixed inset-x-2.5 bottom-[calc(0.6rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-4 gap-1 rounded-[30px] border border-white/60 bg-[rgba(226,230,236,0.82)] p-1.5 shadow-[0_12px_40px_-14px_rgba(6,28,61,0.45),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-2xl backdrop-saturate-[1.6] md:hidden print:hidden"
      >
        {/* Den lyse kapsel glider hen under den aktive fane. */}
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-1.5 left-1.5 top-1.5 rounded-[24px] bg-white/95 shadow-[0_2px_10px_-3px_rgba(6,28,61,0.25)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
          style={{
            width: "calc((100% - 0.75rem - 0.75rem) / 4)",
            transform: `translateX(calc(${TABS.indexOf(activeTab)} * (100% + 0.25rem)))`,
          }}
        />
        <TabLink href="/app" label="Hjem" active={activeTab === "/app"} onTap={setTapped}>
          <path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z" />
        </TabLink>
        <TabLink href={SCAN.href} label="Scan" active={activeTab === "/app/kasse"} onTap={setTapped}>
          <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10" />
        </TabLink>
        <TabLink href={COMMS.href} label="Kommunikation" active={activeTab === "/app/beskeder"} onTap={setTapped}>
          <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" />
          <path d="M8 9.5h8M8 12.5h5" />
        </TabLink>
        <button
          ref={moreBtnRef}
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          aria-expanded={moreOpen}
          aria-controls="menu-ark"
          className={cn(TAB, activeTab === "menu" ? TAB_ON : TAB_OFF)}
        >
          <TabIcon>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </TabIcon>
          Menu
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

// Fanerne i glasbjaelken: en lys glaskapsel glider hen under den aktive (som
// iOS), og alle trykkes en anelse ind ved beroering.
const TAB =
  "relative z-10 flex min-h-[3.4rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[24px] px-0.5 text-[0.66rem] tracking-[-0.01em] max-[370px]:text-[0.6rem] max-[340px]:text-[0.54rem] transition-[color,transform] duration-200 active:scale-95";
// Den aktive fane faar den glidende kapsel (se nav'en); her kun skriften. Paa
// smalle telefoner (under 370 px) bliver skriften lidt mindre, saa
// "Kommunikation" kan staa helt.
const TAB_ON = "font-[600] text-ink";
const TAB_OFF = "text-[#4A5568]";

function TabIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.35rem] w-[1.35rem]" aria-hidden>
      {children}
    </svg>
  );
}

function TabLink({
  href,
  label,
  active,
  onTap,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  onTap: (href: string) => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={() => onTap(href)}
      aria-current={active ? "page" : undefined}
      className={cn(TAB, active ? TAB_ON : TAB_OFF)}
    >
      <TabIcon>{children}</TabIcon>
      <span className="max-w-full truncate">{label}</span>
    </Link>
  );
}

// Ikoner til menu-arket (samme streg som resten).
const ICONS: Record<string, React.ReactNode> = {
  customers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.7 2.3 3 5" />
    </>
  ),
  design: (
    <>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M3.5 9.5h17" />
    </>
  ),
  rules: (
    <>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </>
  ),
  "/app/plakat": (
    <>
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M8.5 15.5h7M8.5 18h4" />
      <rect x="8.5" y="7" width="7" height="5.5" rx="1" />
    </>
  ),
  "/app/visitkort": (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <circle cx="8.5" cy="11" r="1.8" />
      <path d="M6 15c.5-1.3 1.4-2 2.5-2s2 .7 2.5 2M14 10h4M14 13h3" />
    </>
  ),
  "/app/medarbejdere": (
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <circle cx="16.5" cy="9.5" r="2.3" />
      <path d="M16 14.6c2.2.1 3.9 1.4 4.5 3.9" />
    </>
  ),
  "/app/indstillinger": (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6" />
    </>
  ),
  [CALL_HREF]: (
    <path d="M6.5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.7 5.7l1.3-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 5 5.6 1.5 1.5 0 0 1 6.5 4Z" />
  ),
  "/app/aftale": (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M3.5 10h17M7 14.5h4" />
    </>
  ),
};

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="mx-3 mb-1 mt-2 text-[0.66rem] uppercase tracking-[0.14em] text-slate">{title}</p>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

// En raekke i menu-arket: stort trykfelt, ikon og evt. et ekstra link til hoejre
// (fx Statistik). Lukker arket med det samme ved tryk.
function SheetLink({
  href,
  label,
  active,
  onTap,
  icon,
  muted = false,
  extra,
}: {
  href: string;
  label: string;
  active: boolean;
  onTap: (href: string) => void;
  icon?: React.ReactNode;
  muted?: boolean;
  extra?: { href: string; label: string; active: boolean };
}) {
  return (
    <div className={cn("flex items-center rounded-2xl transition-colors", active ? "bg-sand" : "active:bg-sand/70")}>
      <Link
        href={href}
        onClick={() => onTap(href)}
        aria-current={active ? "page" : undefined}
        className="flex min-h-12 flex-1 items-center gap-3 px-3 text-[0.94rem] text-ink"
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-white text-ink" : "bg-parchment text-stone",
            muted && "opacity-50",
          )}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className="h-[1.1rem] w-[1.1rem]" aria-hidden>
            {icon}
          </svg>
        </span>
        <span className={cn(active && "font-[600]", muted && "text-stone")}>{label}</span>
        {muted ? <span className="ml-auto text-[1rem] leading-none text-stone">+</span> : null}
      </Link>
      {extra ? (
        <Link
          href={extra.href}
          onClick={() => onTap(extra.href)}
          aria-current={extra.active ? "page" : undefined}
          className={cn(
            "mr-2 rounded-full px-3 py-1.5 text-[0.8rem] transition-colors",
            extra.active ? "bg-ink text-parchment" : "bg-parchment text-stone active:bg-fog",
          )}
        >
          {extra.label}
        </Link>
      ) : null}
    </div>
  );
}
