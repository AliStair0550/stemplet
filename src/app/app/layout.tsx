import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
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
  // Vis "Pro-aftale" i menuen naar butikken er varslet (>=80) eller har godkendt.
  // Billige flags fra business, ingen ekstra query; foer varsel er den skjult.
  const showAgreement = Boolean(
    business.cardholderWarnedAt || business.proApprovedAt,
  );

  return (
    <div className="min-h-screen bg-parchment">
      <DashboardNav
        businessName={business.name}
        showAgreement={showAgreement}
      />
      <main className="md:pl-60 print:!pl-0">
        <div className="mx-auto max-w-[920px] px-6 py-10 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
