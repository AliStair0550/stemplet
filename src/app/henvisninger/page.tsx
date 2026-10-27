import type { Metadata } from "next";
import Link from "next/link";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { Reveal } from "@/components/henvisninger-site/Reveal";
import { Play } from "@/components/henvisninger-site/Play";
import { Calculator } from "@/components/henvisninger-site/Calculator";
import {
  CodeScreen,
  DeskScene,
  FriendScene,
  MessageScene,
  NotifyScene,
  Phone,
  ShareScene,
  WalletScene,
} from "@/components/henvisninger-site/Screens";
import "./forside.css";

// Henvisningers forside (fase 5, docs/henvisninger.md "Forsiden"). Egen stil:
// hvidt rum, systemfont, sort som eneste accent (Alis valg). Ali bad om mindre
// tekst og mere bevaegelse: siden fortaeller med smaa scener i loop (Screens.tsx,
// forside.css), og teksten er skaaret ned til overskrifter.
// Kundesiderne ligger paa /henvisninger/[butik]; denne side er roden.

const START = "/start?produkt=henvisninger";

export const metadata: Metadata = {
  title: { absolute: "Henvisninger: få flere kunder via dine kunder" },
  description:
    "Henvisningsprogram til frisører, klinikker og saloner. Dine kunder deler en kode, vennen får rabat ved første besøg, og du krydser af ved disken. Virker ved siden af Planway og Bookio.",
  alternates: { canonical: "/henvisninger" },
  openGraph: {
    title: "Henvisninger: få flere kunder via dine kunder",
    description:
      "Dine kunder anbefaler dig allerede. Med Henvisninger får du noget ud af det. Gratis op til 100 kortholdere.",
    type: "website",
    locale: "da_DK",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Henvisninger",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web, iOS",
  description:
    "Henvisninger til frisører og klinikker: kunden deler en kode, vennen får rabat ved første besøg, og kunden får en belønning, når vennen har været der.",
  inLanguage: "da-DK",
  offers: { "@type": "Offer", price: "0", priceCurrency: "DKK" },
  publisher: { "@type": "Organization", name: "Alius", url: "https://alius.dk" },
};

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", Inter, system-ui, sans-serif';

function CTA({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link
      href={START}
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-7 text-[17px] font-medium transition-[transform,background-color] duration-150 active:scale-[0.97] ${
        tone === "dark" ? "bg-[#1D1D1F] text-white hover:bg-black" : "bg-white text-[#1D1D1F] hover:bg-[#F5F5F7]"
      }`}
    >
      Opret din butik gratis
    </Link>
  );
}

function Section({
  children,
  tone = "white",
  id,
}: {
  children: React.ReactNode;
  tone?: "white" | "grey";
  id?: string;
}) {
  return (
    <section id={id} className={`overflow-hidden ${tone === "grey" ? "bg-[#F5F5F7]" : "bg-white"}`}>
      <Reveal className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 md:py-[120px]">{children}</Reveal>
    </section>
  );
}

function Heading({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mx-auto max-w-[640px] text-center">
      <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] md:text-[44px]">{children}</h2>
      {sub ? <p className="mt-3 text-[19px] text-[#6E6E73]">{sub}</p> : null}
    </div>
  );
}

const STEPS = [
  { scene: <ShareScene />, title: "Kunden deler." },
  { scene: <MessageScene />, title: "Vennen kommer." },
  { scene: <NotifyScene />, title: "Begge belønnes.", buzz: true },
];

const BOOKING = ["Planway", "Bookio", "Treatwell", "Booksy", "Fresha", "Papirkalenderen"];

export default function HenvisningerPage() {
  return (
    <div className="bg-white text-[#1D1D1F] antialiased" style={{ fontFamily: FONT }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-40 border-b border-[#D2D2D7]/60 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center justify-between px-4 sm:px-6">
          <Link href="/henvisninger" aria-label="Henvisninger, til forsiden">
            <HenvisningerLogo className="h-[30px]" />
          </Link>
          <nav className="flex items-center gap-5 text-[14px]">
            <Link href="/login" className="text-[#6E6E73] hover:text-[#1D1D1F]">
              Log ind
            </Link>
            <Link
              href={START}
              className="rounded-full bg-[#1D1D1F] px-4 py-1.5 font-medium text-white transition-colors hover:bg-black"
            >
              Kom i gang
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="overflow-hidden bg-white">
          <div className="mx-auto grid max-w-[1080px] items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pb-[120px] md:pt-24">
            <div className="text-center md:text-left">
              <h1 className="text-[44px] font-semibold leading-[1.02] tracking-[-0.03em] sm:text-[56px] lg:text-[68px]">
                Dine kunder{" "}
                <span className="relative inline-block">
                  anbefaler
                  <svg
                    aria-hidden
                    viewBox="0 0 200 14"
                    preserveAspectRatio="none"
                    className="absolute -bottom-[0.12em] left-0 h-[0.22em] w-full overflow-visible"
                  >
                    <path
                      className="hv-underline"
                      d="M3 9 C 45 3, 110 2, 197 6"
                      pathLength={1}
                      fill="none"
                      stroke="#1D1D1F"
                      strokeWidth={4}
                      strokeLinecap="round"
                    />
                  </svg>
                </span>{" "}
                dig allerede.
                <span className="mt-2 block text-[#6E6E73]">Nu får du noget ud af det.</span>
              </h1>
              <div className="mt-10 flex flex-col items-center gap-3 md:items-start">
                <CTA />
                <p className="text-[14px] text-[#6E6E73]">Gratis op til 100 kortholdere.</p>
              </div>
            </div>
            <Play className="relative mx-auto h-[540px] w-[320px] sm:w-[360px]">
              <div className="absolute left-0 top-8 hidden origin-bottom-left -rotate-6 sm:block">
                <Phone>
                  <CodeScreen />
                </Phone>
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-center sm:left-auto sm:right-0">
                <Phone>
                  <FriendScene />
                </Phone>
              </div>
            </Play>
          </div>
        </section>

        {/* Flowet */}
        <Section tone="grey" id="saadan">
          <Heading>Sådan virker det.</Heading>
          <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center text-center">
                <Play>
                  <Phone className={s.buzz ? "hv-buzz" : undefined}>{s.scene}</Phone>
                </Play>
                <p className="mt-8 text-[21px] font-semibold tracking-[-0.01em]">
                  <span className="mr-2 text-[#6E6E73]">{i + 1}</span>
                  {s.title}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Wallet */}
        <Section>
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            <div className="text-center md:text-left">
              <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.025em] md:text-[44px]">
                Koden bor i Apple Wallet.
              </h2>
              <p className="mt-3 text-[19px] text-[#6E6E73]">Kortet opdaterer sig selv.</p>
            </div>
            <Play>
              <WalletScene />
            </Play>
          </div>
        </Section>

        {/* Disken */}
        <Section tone="grey">
          <Heading sub="Belønningen udløses først, når vennen har været der.">Et tryk ved disken.</Heading>
          <Play className="mt-14">
            <DeskScene />
          </Play>
        </Section>

        {/* Booking-systemet */}
        <section className="overflow-hidden bg-white py-16 md:py-[120px]">
          <Reveal className="px-4 sm:px-6">
            <Heading sub="Ingen integration.">Virker ved siden af dit booking-system.</Heading>
          </Reveal>
          <div className="relative mt-12 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <ul className="hv-marquee flex w-max gap-4" aria-label="Booking-systemer">
              {[...BOOKING, ...BOOKING].map((n, i) => (
                <li
                  key={i}
                  aria-hidden={i >= BOOKING.length}
                  className="whitespace-nowrap rounded-full bg-[#F5F5F7] px-7 py-4 text-[20px] font-semibold tracking-[-0.01em] text-[#1D1D1F]/80"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Regneeksempel */}
        <Section tone="grey">
          <Heading>Regn selv efter.</Heading>
          <div className="mt-14">
            <Calculator />
          </div>
        </Section>

        {/* Pris */}
        <Section id="pris">
          <div className="text-center">
            <p className="text-[56px] font-semibold leading-none tracking-[-0.04em] md:text-[88px]">Gratis</p>
            <p className="mt-4 text-[19px] text-[#6E6E73]">op til 100 kortholdere.</p>
            <p className="mt-10 text-[17px]">
              Derefter <span className="font-semibold">99 kr./md.</span>{" "}
              <span className="text-[#6E6E73]">ekskl. moms. Henvisninger er med.</span>
            </p>
          </div>
        </Section>

        {/* Afslutning */}
        <section className="bg-[#1D1D1F] text-white">
          <Reveal className="mx-auto flex max-w-[720px] flex-col items-center px-4 py-20 text-center sm:px-6 md:py-[140px]">
            <HenvisningerLogo tone="light" className="h-[44px] md:h-[56px]" />
            <h2 className="mt-8 text-[36px] font-semibold leading-[1.05] tracking-[-0.03em] md:text-[52px]">
              Lad dine kunder gøre arbejdet.
            </h2>
            <div className="mt-10">
              <CTA tone="light" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="bg-[#F5F5F7]">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10 text-[13px] text-[#6E6E73] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            Lavet af Alius. Vi laver også{" "}
            <Link href="/" className="text-[#1D1D1F] underline-offset-4 hover:underline">
              Stemplet
            </Link>
            .
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/login" className="hover:text-[#1D1D1F]">
              Log ind
            </Link>
            <Link href="/privatliv" className="hover:text-[#1D1D1F]">
              Privatliv
            </Link>
            <Link href="/handelsbetingelser" className="hover:text-[#1D1D1F]">
              Handelsbetingelser
            </Link>
            <a href="mailto:hej@alius.dk" className="hover:text-[#1D1D1F]">
              hej@alius.dk
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
