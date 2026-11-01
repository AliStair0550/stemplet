import type { Metadata } from "next";
import { LoyaltyStart } from "./LoyaltyStart";

type Search = { produkt?: string };

export const metadata: Metadata = {
  title: { absolute: "Opret dit kort - Folka Kort" },
  description:
    "Lav dit loyalitetskort på et minut. Henvisninger og stempler i kundens Apple Wallet. Tre måneder gratis, derefter 49 kr. om måneden ekskl. moms.",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "Opret dit kort - Folka Kort",
    description: "Lav dit loyalitetskort på et minut. Tre måneder gratis, derefter 49 kr. om måneden ekskl. moms.",
    url: "/start",
    siteName: "Folka Kort",
    locale: "da_DK",
    type: "website",
    images: ["/opengraph-image"],
  },
};

// Een oprettelse for loyalitetskortet. ?produkt= vaelger, hvad der er slaaet til
// fra start (fx fra Henvisningers egen side); begge er standard.
export default async function StartPage({ searchParams }: { searchParams: Promise<Search> }) {
  const p = (await searchParams).produkt;
  return <LoyaltyStart initial={p === "henvisninger" ? "henvisninger" : p === "stempler" || p === "stemplet" ? "stempler" : "begge"} />;
}
