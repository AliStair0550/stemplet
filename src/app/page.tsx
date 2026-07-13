import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { Divider } from "@/components/ui";
import Hero from "@/components/marketing/Hero";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import ForCustomers from "@/components/marketing/ForCustomers";
import NoCheating from "@/components/marketing/NoCheating";
import StatsPreview from "@/components/marketing/StatsPreview";
import RoiCalculator from "@/components/marketing/RoiCalculator";
import Pricing from "@/components/marketing/Pricing";
import Faq from "@/components/marketing/Faq";
import FinalCta from "@/components/marketing/FinalCta";

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
        <Problem />
        <Divider />
        <NoCheating />
        <StatsPreview />
        <RoiCalculator />
        <Divider />
        <Pricing />
        <Divider />
        {/* Nederste sektioner: spring initialt render-arbejde over til der
            scrolles naer dem (content-visibility). */}
        <div className="cv-section">
          <ForCustomers />
        </div>
        <Divider />
        <div className="cv-section">
          <Faq />
        </div>
        <div className="cv-section">
          <FinalCta />
        </div>
      </main>
      <Footer />
    </>
  );
}
