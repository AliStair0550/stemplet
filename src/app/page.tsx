import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { Divider } from "@/components/ui";
import Hero from "@/components/marketing/Hero";
import Problem from "@/components/marketing/Problem";
import TryItYourself from "@/components/marketing/TryItYourself";
import LoyaltySteps from "@/components/marketing/LoyaltySteps";
import NoCheating from "@/components/marketing/NoCheating";
import StatsPreview from "@/components/marketing/StatsPreview";
import Pricing from "@/components/marketing/Pricing";
import {
  HowItWorksLazy,
  RoiCalculatorLazy,
  FaqLazy,
} from "@/components/marketing/lazy";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Stemplet",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS",
  description:
    "Digitalt stempelkort i Apple Wallet til caféer, barberer og bagere. Kunderne scanner en QR-kode og har kortet på fem sekunder. Ingen app, ingen tilmelding.",
  url: "https://stemplet.alius.dk",
  inLanguage: "da-DK",
  offers: { "@type": "Offer", price: "0", priceCurrency: "DKK" },
  publisher: { "@type": "Organization", name: "Alius", url: "https://alius.dk" },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main>
        <Hero />
        {/* Under-fold: de tunge klient-komponenter (HowItWorks, RoiCalculator,
            Faq, statistik-grafen) lazy-loades foerst naar man scroller naer dem,
            saa forsidens foerste load kun omfatter hero'en. Server-sektionerne
            SSR'es stadig, men med content-visibility saa deres paint udskydes.
            Raekkefoelge: Proev det selv, Faa flere stamkunder, Loyalitet gjort
            enkelt. Skiftende baggrunde (tint -> sand -> lys) giver kontrast. */}
        <div className="cv-section">
          <TryItYourself />
        </div>
        <HowItWorksLazy />
        <div className="cv-section">
          <LoyaltySteps />
        </div>
        <Divider />
        <div className="cv-section">
          <Problem />
        </div>
        <Divider />
        <div className="cv-section">
          <NoCheating />
        </div>
        <div className="cv-section">
          <StatsPreview />
        </div>
        <div className="cv-section">
          <Pricing />
        </div>
        <Divider />
        <RoiCalculatorLazy />
        <Divider />
        <FaqLazy />
      </main>
      <Footer />
    </>
  );
}
