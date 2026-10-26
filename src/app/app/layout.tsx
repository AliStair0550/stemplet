import type { Metadata } from "next";
import { requireBusiness, getMyBusinesses } from "@/lib/session";
import { DashboardNav } from "./DashboardNav";

export const metadata: Metadata = {
  title: { default: "Overblik", template: "%s - Stemplet" },
  robots: { index: false },
  // Eget manifest for dashboardet: foejer butikken det til hjemmeskaermen, aabner
  // ikonet direkte i /app (ikke forsiden som kundens webkort-manifest).
  manifest: "/app-manifest",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();
  const businesses = await getMyBusinesses();
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
      />
      {/* pb-24 paa mobil: plads til fanerne i bunden. */}
      <main className="pb-24 md:pb-0 md:pl-60 print:!pl-0 print:!pb-0">
        <div className="mx-auto max-w-[960px] px-5 py-8 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
