import Link from "next/link";
import { KundekortMark } from "@/components/ProductLogo";
import { COMPANY } from "@/lib/company";

// Juridiske sider (privatliv, handelsbetingelser, databehandleraftale) i Folkas
// stil. Kunderne kommer hertil fra kortet, saa siden har ingen login eller
// salgsmenu: kun logo, teksten og links mellem de juridiske sider.
const LEGAL_LINKS = [
  { href: "/privatliv", label: "Privatlivspolitik" },
  { href: "/handelsbetingelser", label: "Handelsbetingelser" },
  { href: "/databehandleraftale", label: "Databehandleraftale" },
];

export function LegalLayout({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dash-theme min-h-screen bg-parchment">
      <header className="mx-auto w-full max-w-[760px] px-6 pt-8 md:px-8">
        <KundekortMark />
      </header>
      <main className="pb-20 pt-14">
        <div className="mx-auto w-full max-w-[760px] px-6 md:px-8">
          <h1 className="text-[2.2rem] font-bold leading-tight tracking-[-0.035em] text-ink">{title}</h1>
          <p className="mt-2 text-[0.85rem] text-slate">Senest opdateret {updated}</p>
          {intro ? <p className="mt-6 max-w-xl text-[1.02rem] leading-[1.7] text-stone">{intro}</p> : null}
          <div className="mt-12 flex flex-col gap-9">{children}</div>
        </div>
      </main>
      <footer className="border-t border-fog">
        <div className="mx-auto flex w-full max-w-[760px] flex-wrap items-center gap-x-5 gap-y-2 px-6 py-6 text-[0.85rem] text-stone md:px-8">
          {LEGAL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink">
              {l.label}
            </Link>
          ))}
          <a href={`mailto:${COMPANY.contactEmail}`} className="hover:text-ink sm:ml-auto">
            {COMPANY.contactEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[1.2rem] font-semibold tracking-[-0.015em] text-ink">{title}</h2>
      <div className="flex flex-col gap-3 text-[0.98rem] leading-[1.75] text-stone">{children}</div>
    </section>
  );
}
