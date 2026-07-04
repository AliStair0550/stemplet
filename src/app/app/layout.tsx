import type { Metadata } from "next";
import { requireBusiness } from "@/lib/session";
import { DashboardNav } from "./DashboardNav";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s - Stemplet" },
  robots: { index: false },
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { business } = await requireBusiness();

  return (
    <div className="min-h-screen bg-parchment">
      <DashboardNav businessName={business.name} plan={business.plan} />
      <main className="md:pl-60">
        <div className="mx-auto max-w-[920px] px-6 py-10 md:px-10 md:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}
