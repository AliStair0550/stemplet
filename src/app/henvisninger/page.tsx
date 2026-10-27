import type { Metadata } from "next";
import Link from "next/link";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { Reveal } from "@/components/henvisninger-site/Reveal";
import { Play } from "@/components/henvisninger-site/Play";
import { Calculator } from "@/components/henvisninger-site/Calculator";
import { HandTick, Note, Scribble, hand } from "@/components/henvisninger-site/Hand";
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

// Henvisningers forside (fase 5, docs/henvisninger.md "Forsiden"). Eget udtryk:
// sort paa hvidt med store sorte flader, og logoets haandskrift som noter med
// pile (Hand.tsx), fordi anbefalinger er mund til mund. Smaa scener i loop
// viser produktet (Screens.tsx, forside.css); teksten er skaaret ned til
// overskrifter (Alis oenske). Kundesiderne ligger paa /henvisninger/[butik].

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

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';

function CTA({ tone = "dark" }: { tone?: "dark" | "light" }) {
  return (
    <Link
      href={START}
      className={`group inline-flex min-h-14 items-center justify-center gap-2 rounded-full px-8 text-[17px] font-semibold transition-[transform,background-color] duration-150 active:scale-[0.97] ${
        tone === "dark" ? "bg-[#111] text-white hover:bg-black" : "bg-white text-[#111] hover:bg-[#F2F2F2]"
      }`}
    >
      Opret din butik gratis
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
        →
      </span>
    </Link>
  );
}

function Section({
  children,
  tone = "white",
  id,
  className,
}: {
  children: React.ReactNode;
  tone?: "white" | "black";
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`overflow-hidden ${tone === "black" ? "bg-[#111] text-white" : "bg-white text-[#111]"} ${className ?? ""}`}
    >
      <Reveal className="mx-auto max-w-[1120px] px-4 py-20 sm:px-6 md:py-[140px]">{children}</Reveal>
    </section>
  );
}

function H2({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={`text-[38px] font-bold leading-[1.02] tracking-[-0.035em] md:text-[60px] ${className ?? ""}`}>
      {children}
    </h2>
  );
}

/** Et ord i haandskrift midt i en overskrift. */
function Hand({ children }: { children: React.ReactNode }) {
  return (
    <span className={`${hand.className} relative mx-[0.06em] inline-block font-normal tracking-normal`} style={{ fontSize: "1.12em" }}>
      {children}
    </span>
  );
}

const STEPS = [
  { scene: <ShareScene />, title: "Kunden deler sin kode." },
  { scene: <MessageScene />, title: "Vennen får rabat." },
  { scene: <NotifyScene />, title: "Kunden får sin belønning.", buzz: true },
];

const BOOKING = ["Planway", "Bookio", "Treatwell", "Booksy", "Fresha", "Papirkalenderen"];

export default function HenvisningerPage() {
  return (
    <div className="bg-white text-[#111] antialiased" style={{ fontFamily: FONT }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Link href="/henvisninger" aria-label="Henvisninger, til forsiden">
            <HenvisningerLogo className="h-[34px]" />
          </Link>
          <nav className="flex items-center gap-5 text-[15px]">
            <Link href="/login" className="hidden text-[#111]/60 hover:text-[#111] sm:inline">
              Log ind
            </Link>
            <Link
              href={START}
              className="rounded-full bg-[#111] px-5 py-2 font-semibold text-white transition-colors hover:bg-black"
            >
              Kom i gang
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="overflow-hidden bg-white">
          <div className="mx-auto grid max-w-[1120px] items-center gap-16 px-4 pb-24 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pb-[140px] md:pt-20">
            <Play className="text-center md:text-left">
              <h1 className="text-[52px] font-bold leading-[0.98] tracking-[-0.045em] sm:text-[68px] lg:text-[84px]">
                Dine kunder
                <br />
                <Hand>
                  anbefaler
                  <Scribble className="absolute -bottom-[0.06em] left-[-0.05em] h-[0.18em] w-[105%]" />
                </Hand>
                <br />
                dig allerede.
              </h1>
              <p className="mt-6 text-[22px] font-medium tracking-[-0.01em] text-[#111]/55 md:text-[26px]">
                Nu får du noget ud af det.
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 md:items-start">
                <CTA />
                <p className="flex items-center gap-2 text-[15px] text-[#111]/60">
                  <HandTick className="h-5 w-5 text-[#111]" />
                  Gratis op til 100 kortholdere
                </p>
              </div>
            </Play>
            <Play className="relative mx-auto h-[560px] w-[320px] sm:w-[380px]">
              <div className="absolute left-0 top-10 hidden origin-bottom-left -rotate-6 sm:block">
                <Phone>
                  <CodeScreen />
                </Phone>
              </div>
              <div className="absolute inset-x-0 top-0 flex justify-center sm:left-auto sm:right-0">
                <Phone>
                  <FriendScene />
                </Phone>
              </div>
              <Note arrow="down-left" className="absolute -right-2 -top-12 hidden text-right lg:block xl:-right-24" rotate={6}>
                Emma er ny kunde
              </Note>
              <Note arrow="right" className="absolute -left-40 bottom-6 hidden lg:block xl:-left-44" rotate={-8}>
                Saras kode
              </Note>
            </Play>
          </div>
        </section>

        {/* Flowet, paa sort */}
        <Section tone="black" id="saadan">
          <H2 className="text-center">
            Sådan <Hand>virker</Hand> det.
          </H2>
          <ol className="mt-16 grid gap-16 md:grid-cols-3 md:gap-8">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col items-center text-center">
                <Play>
                  <Phone className={`ring-1 ring-white/15 ${s.buzz ? "hv-buzz" : ""}`}>{s.scene}</Phone>
                </Play>
                <p className={`${hand.className} mt-8 text-[44px] leading-none`}>{i + 1}</p>
                <p className="mt-2 text-[22px] font-semibold tracking-[-0.02em]">{s.title}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Wallet */}
        <Section>
          <div className="grid items-center gap-14 md:grid-cols-2 md:gap-16">
            <div className="text-center md:text-left">
              <H2>
                Koden bor i <Hand>Wallet.</Hand>
              </H2>
              <p className="mt-5 text-[22px] font-medium tracking-[-0.01em] text-[#111]/55">Kortet opdaterer sig selv.</p>
            </div>
            <Play className="relative">
              <WalletScene />
              <Note arrow="down-left" className="absolute -top-16 right-0 hidden text-right sm:block md:-right-6" rotate={5}>
                nyt stempel
              </Note>
              <Note arrow="left" className="absolute -bottom-6 -right-4 hidden sm:block lg:-right-28" rotate={-5}>
                og en belønning
              </Note>
            </Play>
          </div>
        </Section>

        {/* Disken */}
        <Section className="border-t border-[#111]/10">
          <H2 className="text-center">
            <Hand>Ét</Hand> tryk ved disken.
          </H2>
          <p className="mt-5 text-center text-[22px] font-medium tracking-[-0.01em] text-[#111]/55">
            Belønningen kommer først, når vennen har været der.
          </p>
          <Play className="relative mx-auto mt-16 max-w-[720px]">
            <DeskScene />
            <Note arrow="left" className="absolute -right-44 top-[118px] hidden lg:block" rotate={-4}>
              tryk her
            </Note>
          </Play>
        </Section>

        {/* Booking-systemet */}
        <section className="overflow-hidden bg-[#111] py-20 text-white md:py-[140px]">
          <Reveal className="px-4 text-center sm:px-6">
            <H2>
              Virker ved siden af <Hand>alt.</Hand>
            </H2>
            <p className="mt-5 text-[22px] font-medium tracking-[-0.01em] text-white/55">Ingen integration. Intet nyt system.</p>
          </Reveal>
          <div className="relative mt-14 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <ul className="hv-marquee flex w-max gap-4" aria-label="Booking-systemer">
              {[...BOOKING, ...BOOKING].map((n, i) => (
                <li
                  key={i}
                  aria-hidden={i >= BOOKING.length}
                  className="whitespace-nowrap rounded-full border border-white/20 px-8 py-4 text-[22px] font-semibold tracking-[-0.02em] text-white/85"
                >
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Regneeksempel */}
        <Section>
          <H2 className="text-center">
            Regn <Hand>selv</Hand> efter.
          </H2>
          <div className="mt-16">
            <Calculator />
          </div>
        </Section>

        {/* Pris */}
        <Section id="pris" className="border-t border-[#111]/10">
          <Play className="text-center">
            <p className={`${hand.className} text-[96px] leading-none md:text-[150px]`}>Gratis</p>
            <Scribble className="mx-auto -mt-2 block h-4 w-[260px] md:w-[400px]" />
            <p className="mt-6 text-[22px] font-medium tracking-[-0.01em] text-[#111]/55">op til 100 kortholdere.</p>
            <p className="mt-10 text-[17px]">
              Derefter <span className="font-semibold">99 kr./md.</span>{" "}
              <span className="text-[#111]/55">ekskl. moms. Henvisninger er med.</span>
            </p>
          </Play>
        </Section>

        {/* Afslutning */}
        <section className="bg-[#111] text-white">
          <Reveal className="mx-auto flex max-w-[760px] flex-col items-center px-4 py-24 text-center sm:px-6 md:py-[160px]">
            <HenvisningerLogo tone="light" className="h-[52px] md:h-[68px]" />
            <h2 className="mt-10 text-[40px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[64px]">
              Lad dine kunder <Hand>gøre</Hand> arbejdet.
            </h2>
            <div className="mt-12">
              <CTA tone="light" />
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="bg-[#111] text-white/55">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-6 border-t border-white/10 px-4 py-10 text-[13px] sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            Lavet af Alius. Vi laver også{" "}
            <Link href="/" className="text-white underline-offset-4 hover:underline">
              Stemplet
            </Link>
            .
          </p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/login" className="hover:text-white">
              Log ind
            </Link>
            <Link href="/privatliv" className="hover:text-white">
              Privatliv
            </Link>
            <Link href="/handelsbetingelser" className="hover:text-white">
              Handelsbetingelser
            </Link>
            <a href="mailto:hej@alius.dk" className="hover:text-white">
              hej@alius.dk
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
