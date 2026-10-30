import type { Metadata } from "next";
import { KundekortPage } from "@/components/kundekort/KundekortPage";

// Forsiden paa kort.folka.dk: Folka Kort. Stemplets egen forside
// ligger paa /stemplet og Henvisningers paa /henvisninger.
export const metadata: Metadata = {
  title: { absolute: "Folka Kort: dit eget kundekort" },
  description:
    "Folka Kort er dit eget kundekort. Dine kunder har det på telefonen. Stempler, henvisninger og beskeder. Tre måneder gratis, derefter 49 kr. om måneden.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Folka Kort",
    description: "Dit kort. Dine kunder. Din kanal.",
    siteName: "Folka Kort",
    locale: "da_DK",
    type: "website",
  },
};

export default function Page() {
  return <KundekortPage />;
}
