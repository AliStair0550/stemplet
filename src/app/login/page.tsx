import type { Metadata } from "next";
import Link from "next/link";
import { FolkaLogo, HenvisningerLogo, StempletLogo } from "@/components/ProductLogo";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Log ind",
  // Samme dashboard-manifest: foejer man login til hjemmeskaermen, aabner ikonet
  // i dashboardet (start_url /app), ikke forsiden.
  manifest: "/app-manifest",
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';

// Login er faelles for Folkas produkter, saa siden baerer Folka i samme udtryk
// som "Kom i gang": hvidt, sort, systemfont.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ fejl?: string }>;
}) {
  const { fejl } = await searchParams;
  const notice =
    fejl === "onboarding"
      ? "Din butik er oprettet. Log ind her, så kommer du ind i dashboardet."
      : null;

  return (
    <main className="flex min-h-screen flex-col bg-white text-[#111] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 w-full max-w-[1120px] items-center px-4 sm:px-6">
        <FolkaLogo />
      </header>
      <div className="flex flex-1 items-center justify-center px-4 pb-20 sm:px-6">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div>
            <h1 className="text-[40px] font-bold leading-[1.04] tracking-[-0.04em]">Log ind.</h1>
            <p className="mt-3 text-[17px] text-[#111]/55">Vi sender et sikkert link til din e-mail. Ingen adgangskode.</p>
          </div>
          {notice ? (
            <p className="rounded-[14px] bg-[#F5F5F7] px-4 py-3 text-[15px] leading-relaxed">{notice}</p>
          ) : null}
          <LoginForm />
          <div className="border-t border-[#111]/10 pt-6">
            <p className="text-[15px] text-[#111]/55">Ny her? Kom gratis i gang med</p>
            <div className="mt-3 flex items-center gap-5">
              <Link href="/start" aria-label="Kom i gang med Stemplet" className="opacity-80 transition-opacity hover:opacity-100">
                <StempletLogo className="text-[1.35rem]" />
              </Link>
              <span className="text-[#111]/25">eller</span>
              <Link
                href="/start?produkt=henvisninger"
                aria-label="Kom i gang med Henvisninger"
                className="opacity-80 transition-opacity hover:opacity-100"
              >
                <HenvisningerLogo className="h-[1.75rem]" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
