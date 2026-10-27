import type { Metadata } from "next";
import Link from "next/link";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { Reveal } from "@/components/henvisninger-site/Reveal";
import { CodeScreen, DeskScreen, FriendScreen, LockScreen, Phone } from "@/components/henvisninger-site/Screens";

// Henvisningers forside (fase 5, docs/henvisninger.md "Forsiden"). Egen stil:
// hvidt rum, systemfont, sort som eneste accent (Alis valg), ingen dekoration.
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

function CTA({ children = "Opret din butik gratis" }: { children?: React.ReactNode }) {
  return (
    <Link
      href={START}
      className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#1D1D1F] px-7 text-[17px] font-medium text-white transition-colors hover:bg-black"
    >
      {children}
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
    <section id={id} className={tone === "grey" ? "bg-[#F5F5F7]" : "bg-white"}>
      <Reveal className="mx-auto max-w-[1080px] px-4 py-16 sm:px-6 md:py-[120px]">{children}</Reveal>
    </section>
  );
}

function Heading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[640px] text-center">
      <h2 className="text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[32px]">{children}</h2>
      {sub ? <p className="mt-4 text-[17px] leading-[1.5] text-[#6E6E73]">{sub}</p> : null}
    </div>
  );
}

const STEPS = [
  {
    screen: <CodeScreen />,
    title: "Kunden deler sin kode.",
    text: "Koden ligger i Apple Wallet og på en side, der kan sendes på SMS eller Messenger.",
  },
  {
    screen: <FriendScreen />,
    title: "Vennen tilmelder sig.",
    text: "Navn og mobil. Rabatten ligger klar til første besøg.",
  },
  {
    screen: <LockScreen />,
    title: "Begge får noget ud af det.",
    text: "Du trykker Rabat givet ved disken. Kunden får besked på telefonen med det samme.",
  },
];

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
        {/* 1. Hero */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-[1080px] items-center gap-12 px-4 pb-16 pt-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-[120px] md:pt-24">
            <div className="text-center md:text-left">
              <h1 className="text-[40px] font-semibold leading-[1.04] tracking-[-0.02em] sm:text-[48px] lg:text-[56px]">
                Dine kunder anbefaler dig allerede.
                <span className="block text-[#6E6E73]">Nu får du noget ud af det.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-[520px] text-[17px] leading-[1.55] text-[#6E6E73] md:mx-0">
                Hver kunde får sin egen kode. Vennen får rabat ved første besøg, og kunden får en belønning, når vennen
                har været der. Du krydser af ved disken.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 md:items-start">
                <CTA />
                <p className="text-[14px] text-[#6E6E73]">Gratis op til 100 kortholdere. Intet kreditkort.</p>
              </div>
            </div>
            <Phone>
              <FriendScreen />
            </Phone>
          </div>
        </section>

        {/* 2. Flowet i tre billeder */}
        <Section tone="grey" id="saadan">
          <Heading sub="Ingen app at hente. Kunden skal bare have sin telefon.">Sådan virker det.</Heading>
          <ol className="mt-14 grid gap-14 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center text-center">
                <Phone>{s.screen}</Phone>
                <p className="mt-8 text-[14px] font-medium text-[#6E6E73]">{i + 1}</p>
                <h3 className="mt-1 text-[21px] font-semibold tracking-[-0.01em]">{s.title}</h3>
                <p className="mt-2 max-w-[300px] text-[15px] leading-[1.5] text-[#6E6E73]">{s.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* 3. Booking-systemet */}
        <Section>
          <Heading sub="Henvisninger kræver ingen integration og ingen adgang til dine kundedata. Det kører ved siden af det system, du allerede bruger.">
            Virker ved siden af dit booking-system.
          </Heading>
          <ul className="mx-auto mt-10 flex max-w-[640px] flex-wrap justify-center gap-3">
            {["Planway", "Bookio", "Treatwell", "Papirkalenderen"].map((n) => (
              <li key={n} className="rounded-full bg-[#F5F5F7] px-5 py-2.5 text-[15px] font-medium">
                {n}
              </li>
            ))}
          </ul>
        </Section>

        {/* 4. Hvad butikken ser */}
        <Section tone="grey">
          <Heading sub="En liste over hvem der venter på første besøg, og hvem der har en belønning til gode. Et tryk, så er det registreret.">
            Det ser du ved disken.
          </Heading>
          <div className="mt-14">
            <DeskScreen />
          </div>
          <p className="mx-auto mt-10 max-w-[560px] text-center text-[15px] leading-[1.5] text-[#6E6E73]">
            Belønningen udløses først, når vennen har været hos dig. En falsk tilmelding giver ingenting.
          </p>
        </Section>

        {/* 5. Pris */}
        <Section id="pris">
          <Heading>Samme pris som Stemplet.</Heading>
          <dl className="mx-auto mt-12 max-w-[560px] divide-y divide-[#D2D2D7] border-y border-[#D2D2D7]">
            {[
              ["Gratis", "op til 100 kortholdere"],
              ["99 kr./md.", "ekskl. moms med Pro, når du har flere"],
              ["0 kr. ekstra", "Henvisninger er med i Pro, ikke et tillæg"],
            ].map(([a, b]) => (
              <div key={a} className="flex items-baseline justify-between gap-6 py-5">
                <dt className="whitespace-nowrap text-[21px] font-semibold tracking-[-0.01em]">{a}</dt>
                <dd className="text-right text-[15px] text-[#6E6E73]">{b}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 6. Regneeksempel (indtil den foerste case findes) */}
        <Section tone="grey">
          <Heading sub="Et regneeksempel for en salon med 20 glade stamkunder.">Små tal bliver til mange kunder.</Heading>
          <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-3 gap-4 text-center">
            {[
              ["20", "ambassadører"],
              ["2", "venner hver om året"],
              ["40", "nye kunder"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-[44px] font-semibold leading-none tracking-[-0.03em] md:text-[64px]">{n}</p>
                <p className="mt-3 text-[14px] text-[#6E6E73] md:text-[15px]">{l}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Afslutning */}
        <section className="bg-white">
          <Reveal className="mx-auto flex max-w-[640px] flex-col items-center px-4 py-16 text-center sm:px-6 md:py-[120px]">
            <h2 className="text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[40px]">
              Lad dine kunder gøre arbejdet.
            </h2>
            <p className="mt-4 text-[17px] leading-[1.5] text-[#6E6E73]">
              Fortæl kort om din butik, så sætter vi det op sammen med dig.
            </p>
            <div className="mt-8">
              <CTA />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-[#D2D2D7] bg-[#F5F5F7]">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-6 px-4 py-10 text-[13px] text-[#6E6E73] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            Henvisninger er lavet af Alius. Vi laver også{" "}
            <Link href="/" className="text-[#1D1D1F] underline-offset-4 hover:underline">
              Stemplet
            </Link>
            , det digitale stempelkort.
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
