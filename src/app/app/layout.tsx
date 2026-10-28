import type { Metadata } from "next";
import { requireBusiness, getMyBusinesses, getSupportBusiness } from "@/lib/session";
import { endSupport } from "../admin/actions";
import { DashboardNav } from "./DashboardNav";

export const metadata: Metadata = {
  title: { default: "Hjem", template: "%s - Kundekort" },
  robots: { index: false },
  // Eget manifest for dashboardet: foejer butikken det til hjemmeskaermen, aabner
  // ikonet direkte i /app (ikke forsiden som kundens webkort-manifest). Folka-
  // ikonet: hvidt kursivt f paa Folkas moerkeblaa (som folka.dk).
  manifest: "/app-manifest",
  appleWebApp: { capable: true, title: "Folka", statusBarStyle: "default" },
  icons: { apple: "/app-apple-touch-icon.png" },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();
  const businesses = await getMyBusinesses();
  const support = await getSupportBusiness();
  // Vis "Pro-aftale" i menuen naar butikken er varslet (>=80) eller har godkendt.
  // Billige flags fra business, ingen ekstra query; foer varsel er den skjult.
  const showAgreement = Boolean(
    business.cardholderWarnedAt || business.proApprovedAt,
  );

  return (
    // dash-theme: sorte knapper i hele dashboardet (se globals.css).
    <div className="dash-theme min-h-screen bg-parchment">
      <DashboardNav
        businesses={businesses}
        activeBusinessId={business.id}
        showAgreement={showAgreement}
        showReferrals={business.referralsEnabled}
        showStamps={business.stampsEnabled}
      />
      {/* pb-24 paa mobil: plads til fanerne i bunden. */}
      <main className="pb-24 md:pb-0 md:pl-60 print:!pl-0 print:!pb-0">
        {support ? (
          // Support-tilstand: tydeligt, at superadmin arbejder i en kundes butik.
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-[#061C3D] px-5 py-2.5 text-[0.85rem] text-white md:px-10 print:hidden">
            <span>
              <span className="font-[600]">Support:</span> du arbejder i {support.name} som superadmin.
            </span>
            <form action={endSupport}>
              <button type="submit" className="rounded-full bg-white px-4 py-1 text-[0.8rem] font-[600] text-[#0B1628]">
                Afslut support
              </button>
            </form>
          </div>
        ) : null}
        <div className="mx-auto max-w-[960px] px-5 py-8 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
