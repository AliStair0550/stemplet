import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { Divider } from "@/components/ui";
import Hero from "@/components/marketing/Hero";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import TryItYourself from "@/components/marketing/TryItYourself";
import NoCheating from "@/components/marketing/NoCheating";
import StatsPreview from "@/components/marketing/StatsPreview";
import RoiCalculator from "@/components/marketing/RoiCalculator";
import Pricing from "@/components/marketing/Pricing";
import Faq from "@/components/marketing/Faq";

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
        <HowItWorks />
        <Divider />
        {/* Under-fold-sektioner: spring browserens render-/paint-arbejde over,
            indtil man scroller naer dem (content-visibility). Sparer meget paa
            mobil, hvor hele siden ellers layoutes paa een gang. */}
        <div className="cv-section">
          <TryItYourself />
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
        <div className="cv-section">
          <RoiCalculator />
        </div>
        <Divider />
        <div className="cv-section">
          <Faq />
        </div>
      </main>
      <Footer />
    </>
  );
}
