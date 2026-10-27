import type { Metadata } from "next";
import { Wordmark } from "@/components/Wordmark";
import { StartRequestForm } from "./StartRequestForm";
import { HenvisningerStart } from "./HenvisningerStart";

type Search = { produkt?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  if ((await searchParams).produkt === "henvisninger") {
    return {
      title: { absolute: "Kom i gang med Henvisninger" },
      description: "Lav din rabatordning, så sætter vi din henvisningsside op sammen med dig. Gratis og uden kreditkort.",
    };
  }
  return {
    title: "Kom gratis i gang",
    description:
      "Fortæl kort om din butik, så laver vi et udkast til dit stempelkort og tager fat i dig. Ingen konto eller kreditkort.",
  };
}

export default async function StartPage({ searchParams }: { searchParams: Promise<Search> }) {
  // Fra Henvisningers forside: Henvisninger som udgangspunkt, i eget udtryk.
  // Stempelkortet er et tilvalg. Uden ?produkt er siden Stemplets, som foer.
  if ((await searchParams).produkt === "henvisninger") return <HenvisningerStart />;
  return (
    <main className="min-h-screen bg-parchment">
      <header className="border-b border-fog">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-5 md:px-8">
          <Wordmark />
          <span className="text-[0.7rem] font-[300] uppercase tracking-[0.12em] text-slate">
            Gratis. Intet kreditkort.
          </span>
        </div>
      </header>
      <div className="px-6 py-14 md:px-8 md:py-20">
        <StartRequestForm />
      </div>
    </main>
  );
}
