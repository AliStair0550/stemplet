import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import Link from "next/link";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { StartRequestForm } from "./StartRequestForm";

export const metadata: Metadata = {
  title: "Kom gratis i gang",
  description:
    "Fortæl kort om din butik, så laver vi et udkast til dit stempelkort og tager fat i dig. Ingen konto eller kreditkort.",
};

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ produkt?: string }>;
}) {
  // Fra Henvisningers forside: forvaelg Henvisninger.
  const referrals = (await searchParams).produkt === "henvisninger";
  return (
    // Fra Henvisninger: sorte knapper som i resten af Henvisninger (.dash-theme).
    <main className={`min-h-screen bg-parchment ${referrals ? "dash-theme" : ""}`}>
      <header className="border-b border-fog">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 md:px-8">
          {referrals ? (
            <Link href="/henvisninger" aria-label="Henvisninger, til forsiden">
              <HenvisningerLogo className="h-[30px]" />
            </Link>
          ) : (
            <Wordmark />
          )}
          <span className="text-[0.7rem] font-[300] uppercase tracking-[0.12em] text-slate">
            Gratis. Intet kreditkort.
          </span>
        </div>
      </header>
      <div className="px-6 py-14 md:px-8 md:py-20">
        <StartRequestForm initialReferrals={referrals} />
      </div>
    </main>
  );
}
