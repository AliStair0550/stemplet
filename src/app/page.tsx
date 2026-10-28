import type { Metadata } from "next";
import { KundekortPage } from "@/components/kundekort/KundekortPage";

// Forsiden paa kort.folka.dk: Kundekort fra Folka. Stemplets egen forside
// ligger paa /stemplet og Henvisningers paa /henvisninger.
export const metadata: Metadata = {
  title: { absolute: "Kundekort fra Folka: stempler og henvisninger i Apple Wallet" },
  description:
    "Ét kundekort med dit navn og dine farver i kundens Apple Wallet. Stempler, henvisninger og belønninger samlet. Ingen app, kun navn og e-mail. Gratis op til 100 kortholdere.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kundekort fra Folka",
    description: "Kunderne kommer igen. Kortet sørger for det. Stempler og henvisninger i Apple Wallet.",
    siteName: "Kundekort",
    locale: "da_DK",
    type: "website",
  },
};

export default function Page() {
  return <KundekortPage />;
}
