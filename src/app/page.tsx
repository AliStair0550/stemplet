import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { Divider } from "@/components/ui";
import Hero from "@/components/marketing/Hero";
import Problem from "@/components/marketing/Problem";
import HowItWorks from "@/components/marketing/HowItWorks";
import ForCustomers from "@/components/marketing/ForCustomers";
import NoCheating from "@/components/marketing/NoCheating";
import StatsPreview from "@/components/marketing/StatsPreview";
import Pricing from "@/components/marketing/Pricing";
import Faq from "@/components/marketing/Faq";
import FinalCta from "@/components/marketing/FinalCta";

export default function Page() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Divider />
        <Problem />
        <HowItWorks />
        <Divider />
        <ForCustomers />
        <NoCheating />
        <StatsPreview />
        <Divider />
        <Pricing />
        <Divider />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}
