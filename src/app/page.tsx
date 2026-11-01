import type { Metadata, Viewport } from "next";
import { KundekortPage } from "@/components/kundekort/KundekortPage";
import { PLATFORM } from "@/lib/platform";

// Forsiden paa kort.folka.dk: Folka Kort.
// Forsidens hero er natteblaa: browserens top paa telefonen foelger med.
export const viewport: Viewport = { themeColor: "#020B1C" };

export const metadata: Metadata = {
  title: { absolute: "Folka Kort: dit eget loyalitetskort" },
  description:
    "Folka Kort er dit eget loyalitetskort. Dine kunder har det på telefonen. Stempler, henvisninger og beskeder. Tre måneder gratis, derefter 49 kr. om måneden.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Folka Kort",
    description: "Dit kort. Dine kunder. Din kanal.",
    siteName: "Folka Kort",
    locale: "da_DK",
    type: "website",
  },
};

// Strukturerede data til Google (usynlige paa siden): Folka som organisation,
// sitet og Folka Kort som produkt med pris.
const SITE = "https://kort.folka.dk";
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://folka.dk/#organization",
      name: "Folka",
      url: "https://folka.dk",
      logo: `${SITE}/folka-logo.svg`,
      email: PLATFORM.contactEmail,
      telephone: PLATFORM.supportPhone,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      url: SITE,
      name: "Folka Kort",
      inLanguage: "da-DK",
      publisher: { "@id": "https://folka.dk/#organization" },
    },
    {
      "@type": "SoftwareApplication",
      name: "Folka Kort",
      url: SITE,
      applicationCategory: "BusinessApplication",
      operatingSystem: "iOS, Android, Web",
      description:
        "Digitalt loyalitetskort i Apple Wallet med stempler, henvisninger, tilbud og beskeder til fysiske butikker.",
      publisher: { "@id": "https://folka.dk/#organization" },
      offers: {
        "@type": "Offer",
        price: "49",
        priceCurrency: "DKK",
        description: "Tre måneder gratis, derefter 49 kr. om måneden ekskl. moms. Ingen binding.",
      },
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <KundekortPage />
    </>
  );
}
