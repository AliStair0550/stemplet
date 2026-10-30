import type { Metadata } from "next";
import Link from "next/link";
import { KundekortMark } from "@/components/ProductLogo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: { absolute: "Log ind - Folka Kort" },
  // Samme dashboard-manifest: foejer man login til hjemmeskaermen, aabner ikonet
  // i dashboardet (start_url /app), ikke forsiden.
  manifest: "/app-manifest",
};

const FONT = 'var(--font-kk), -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

// Login er faelles for Folkas produkter, saa siden baerer Folka i samme udtryk
// som "Kom i gang": hvidt, sort, systemfont.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string; error?: string }>;
}) {
  const { fejl, error } = await searchParams;
  // error=Verification: Auth.js' fejl for et brugt eller udloebet login-link.
  const notice =
    fejl === "onboarding"
      ? "Din butik er oprettet. Log ind her, så kommer du ind i dashboardet."
      : error === "Verification"
        ? "Linket er brugt eller udløbet. Skriv din e-mail, så sender vi et nyt."
        : null;

  return (
    <main className="dash-theme flex min-h-screen flex-col bg-white text-[#0B1628] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden">
          <KundekortMark />
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-20 sm:px-6">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div>
            <h1 className="text-[40px] font-bold leading-[1.04] tracking-[-0.04em]">Log ind.</h1>
            <p className="mt-3 text-[17px] text-[#0B1628]/55">Vi sender et sikkert link til din e-mail. Ingen adgangskode.</p>
          </div>
          {notice ? (
            <p className="rounded-[14px] bg-[#F2F5F9] px-4 py-3 text-[15px] leading-relaxed">{notice}</p>
          ) : null}
          <LoginForm />
          <div className="border-t border-[#0B1628]/10 pt-6">
            <p className="text-[15px] text-[#0B1628]/55">
              Ny her?{" "}
              <Link href="/start" className="font-semibold text-[#061C3D] underline-offset-4 hover:underline">
                Opret dit kort gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
