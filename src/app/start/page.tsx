import type { Metadata } from "next";
import { StempletStart } from "./StempletStart";
import { HenvisningerStart } from "./HenvisningerStart";

type Search = { produkt?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<Search> }): Promise<Metadata> {
  if ((await searchParams).produkt === "henvisninger") {
    return {
      title: { absolute: "Kom i gang med Henvisninger" },
      description: "Lav din rabatordning, så er din henvisningsside klar på et minut. Gratis og uden kreditkort.",
    };
  }
  return {
    title: "Kom gratis i gang",
    description: "Lav dit digitale stempelkort, så er det klar på et minut. Gratis og uden kreditkort.",
  };
}

// Selvbetjent oprettelse i samme udtryk for begge produkter: Stemplet som
// standard, Henvisninger via ?produkt=henvisninger.
export default async function StartPage({ searchParams }: { searchParams: Promise<Search> }) {
  if ((await searchParams).produkt === "henvisninger") return <HenvisningerStart />;
  return <StempletStart />;
}
