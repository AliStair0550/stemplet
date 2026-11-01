import Link from "next/link";
import { Inter } from "next/font/google";
import { StampIcon } from "@/components/StampIcon";
import type { StampIconKey } from "@/lib/brand";
import { CARDS, MemberCard, type MemberCardData } from "./MemberCard";
import { Story } from "./Story";
import { LiveStamps } from "./LiveStamps";
import { HeroFan } from "./HeroFan";
import { Footer, Wordmark } from "./SiteChrome";
import { ReferralTicker } from "./ReferralTicker";
import "./kundekort.css";

// Folka Kort: forsiden paa kort.folka.dk. Navnet er "Folka Kort" (altid stort K);
// "kundekort" bruges kun som forklaring. Tone: som en dygtig ven, der selv har
// haft butik. Korte saetninger, du-form, konkrete tal, ingen udraabstegn.

const inter = Inter({ subsets: ["latin"], variable: "--font-kk", display: "swap" });

// Hjulet i hero: den kendte vifte i midten (Kaffestuen) og flere kort paa hver
// side, som man kan swipe frem.
const FAN = [
  CARDS.kage, CARDS.yoga, CARDS.cykel, CARDS.vin,
  CARDS.museum, CARDS.blomster, CARDS.salon, CARDS.cafe, CARDS.havn, CARDS.bar, CARDS.bager,
  CARDS.juice, CARDS.sushi, CARDS.klinik, CARDS.grill, CARDS.mode,
] as MemberCardData[];
const FAN_START = FAN.indexOf(CARDS.cafe!);

const ROW_A = [CARDS.cafe, CARDS.museum, CARDS.negle, CARDS.havn, CARDS.barber, CARDS.blomster, CARDS.pizza] as MemberCardData[];
const ROW_B = [CARDS.bar, CARDS.bager, CARDS.salon, CARDS.is, CARDS.museum, CARDS.havn, CARDS.pizza] as MemberCardData[];

const TRADES = ["Caféer", "Frisører", "Barberer", "Bagerier", "Pizzeriaer", "Blomsterbutikker", "Neglesaloner", "Massører", "Isbutikker", "Ølbarer", "Kaffebarer", "Klinikker", "Butikker"];

function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden">
          <Wordmark dark />
        </Link>
        <nav className="kk-glass-pill hidden items-center gap-1 p-1 text-[14px] text-white/75 md:flex" aria-label="Sektioner">
          {[
            ["#historien", "Sådan virker det"],
            ["#funktioner", "Funktioner"],
            ["#pris", "Pris"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 transition-colors hover:bg-white/10 hover:text-white">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="rounded-full px-3 py-2 text-[13px] font-medium text-white/80 transition-colors hover:text-white sm:px-4 sm:text-[14px]">
            Log ind
          </Link>
          <Link
            href="/start"
            className="rounded-full bg-white px-4 py-2 text-[14px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Opret dit kort
          </Link>
        </div>
      </div>
    </header>
  );
}

function Lights() {
  return (
    <>
      <div className="kk-light" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="kk-grid" aria-hidden />
    </>
  );
}

function Hero() {
  return (
    <section className="kk-dark pb-0 pt-32 sm:pt-36">
      <Lights />
      <div className="mx-auto max-w-[1200px] px-4 text-center sm:px-6">
        <h1 className="mx-auto text-[clamp(2.5rem,6.6vw,5.2rem)] font-semibold leading-[1] tracking-[-0.045em]">
          Dit kort.
          <br />
          {/* Hver saetning holdes samlet, saa linjen aldrig brydes midt i "Din kanal." */}
          <span className="text-white/45">
            <span className="whitespace-nowrap">Dine kunder.</span> <span className="whitespace-nowrap">Din kanal.</span>
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-[34rem] text-[1.08rem] leading-relaxed text-white/70">
          Dit eget digitale kundekort direkte i Apple Wallet. De samler stempler, får dine tilbud og tager vennerne med.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/start"
            className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            Opret dit kort gratis
          </Link>
          {/* Til den, der vil vide mere foerst: skriv dig op eller proev kortet. */}
          <Link
            href="/hør-mere"
            className="kk-glass-pill px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/15"
          >
            Hør mere
          </Link>
        </div>
        <p className="mt-4 text-[13px] text-white/50">Tre måneder gratis. Derefter 49 kr. om måneden ekskl. moms. Ingen binding.</p>
      </div>

      {/* Viften af kort: forskellige butikker, samme kort. Swipe for flere. */}
      <HeroFan cards={FAN} start={FAN_START} />
      <div className="relative z-10 h-24 bg-gradient-to-b from-transparent to-[#020B1C]" aria-hidden />
    </section>
  );
}

function Trades() {
  const list = [...TRADES, ...TRADES];
  return (
    <section className="kk-dark border-t border-white/5 py-7" aria-label="Brancher">
      <div className="kk-marquee overflow-hidden">
        <div className="kk-track gap-10" style={{ "--t": "50s" } as React.CSSProperties}>
          {list.map((t, i) => (
            <span key={i} aria-hidden={i >= TRADES.length || undefined} className="whitespace-nowrap text-[15px] font-medium text-white/45">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// Ingen tags over overskrifterne: titlen skal sige det hele.
function SectionHead({ title, text, light = true }: { title: React.ReactNode; text?: string; light?: boolean }) {
  return (
    <div className="kk-reveal mx-auto max-w-[56rem] px-4 text-center sm:px-6">
      <h2 className="text-[clamp(2rem,4.6vw,3.4rem)] font-semibold leading-[1.03] tracking-[-0.04em]">{title}</h2>
      {text ? (
        <p className={light ? "mx-auto mt-4 max-w-[36rem] text-[1.06rem] leading-relaxed text-[#5F6B7E]" : "mx-auto mt-4 max-w-[36rem] text-[1.06rem] leading-relaxed text-white/65"}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

function StorySection() {
  return (
    <section id="historien" className="scroll-mt-4 bg-[#F2F5F9] pb-10 pt-24 sm:pt-32 lg:pb-32">
      <SectionHead
        title={
          <>
            Kunder, der kommer igen.
            <br />
            <span className="text-[#8D98A8]">Og tager vennerne med.</span>
          </>
        }
        text="Følg Emma fra første kop til fast gæst."
      />
      <div className="mx-auto mt-6 max-w-[1100px] px-4 sm:px-6">
        <Story />
      </div>
    </section>
  );
}

function CardRow({ cards, reverse, t }: { cards: MemberCardData[]; reverse?: boolean; t: string }) {
  const list = [...cards, ...cards];
  return (
    <div className="kk-marquee overflow-hidden py-4">
      <div className="kk-track gap-5" data-reverse={reverse ? "" : undefined} style={{ "--t": t } as React.CSSProperties}>
        {list.map((c, i) => (
          <div key={i} className="w-[200px] shrink-0 sm:w-[244px]">
            <MemberCard card={c} sizes="244px" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Gallery() {
  return (
    <section id="kort" className="overflow-hidden bg-white py-24 sm:py-32">
      <SectionHead title="Ét kort. Din butik." text="Dine farver, dit ikon, dine ord. Kortet ligner dig, ikke os." />
      <div className="mt-14 grid gap-2" aria-hidden>
        <CardRow cards={ROW_A} t="70s" />
        <CardRow cards={ROW_B} t="80s" reverse />
      </div>
    </section>
  );
}

function Tile({
  icon,
  title,
  text,
  children,
  className = "",
}: {
  icon: StampIconKey;
  title: string;
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`kk-reveal flex flex-col rounded-[28px] bg-white p-7 kk-shadow-1 ${className}`}>
      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F0FB] text-[#1B5EAE]">
        <StampIcon icon={icon} className="h-5 w-5" />
      </span>
      <h3 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.025em]">{title}</h3>
      <p className="mt-2 text-[0.98rem] leading-relaxed text-[#5F6B7E]">{text}</p>
      {children ? <div className="mt-auto pt-6">{children}</div> : null}
    </div>
  );
}

function Features() {
  return (
    <section id="funktioner" className="scroll-mt-4 bg-[#F2F5F9] py-24 sm:py-32">
      <SectionHead
        title={
          <>
            Alt, der bringer kunderne tilbage.
            <br />
            <span className="text-[#8D98A8]">Intet, du skal bruge tid på.</span>
          </>
        }
      />
      <div className="mx-auto mt-14 grid max-w-[1100px] gap-4 px-4 sm:px-6 md:grid-cols-6">
        <Tile icon="star" title="Stempler" text="Du vælger antal og belønning. Kunden ser kortet fyldes og kommer igen." className="md:col-span-3">
          <LiveStamps />
        </Tile>
        <Tile icon="heart" title="Henvisninger" text="Vennen får rabat første gang. Kunden får en belønning. Du får en ny kunde." className="md:col-span-3">
          <ReferralTicker />
        </Tile>
        <Tile icon="sparkle" title="Direkte beskeder" text="Din besked direkte på kundens låseskærm." className="md:col-span-2" />
        <Tile icon="gift" title="Særlige rabatter" text="Tilbud kun for kortholdere og rabatter hos dine samarbejdspartnere." className="md:col-span-2" />
        <Tile icon="brush" title="Dit design" text="Design dit loyalitetskort, som du vil: farver, logo, billede og stempel. Kortet ligner din butik." className="md:col-span-2" />
        <Tile icon="hand" title="Ét scan ved kassen" text="Stempel, rabat og belønning på samme skærm. Klaret på få sekunder." className="md:col-span-2" />
        <Tile icon="leaf" title="Tal, du kan bruge" text="Hvem kommer igen, og hvem tager andre med. Uge for uge." className="md:col-span-2" />
        <Tile icon="book" title="Fyld bogen" text="Et hul kl. 14? Skriv »Ledig tid kl. 14, 20 % rabat«. Beskeden lander hos dine kortholdere med det samme." className="md:col-span-2" />
      </div>
    </section>
  );
}

function Security() {
  const items = [
    ["Kan ikke kopieres", "Hvert stempel er signeret og virker én gang."],
    ["Kun dine folk stempler", "Et stempel kræver, at personalet scanner kortet."],
    ["PIN ved belønning", "Slå personale-PIN til, så kun dine folk kan frigive en belønning."],
  ];
  return (
    <section className="kk-dark py-24 sm:py-32">
      <Lights />
      <SectionHead
        light={false}
        title={
          <>
            Ingen kan stemple sig selv.
            <br />
            <span className="text-white/45">Heller ikke med et skærmbillede.</span>
          </>
        }
      />
      <div className="mx-auto mt-14 grid max-w-[1100px] gap-4 px-4 sm:px-6 md:grid-cols-3">
        {items.map(([t, d]) => (
          <div key={t} className="kk-reveal kk-glass rounded-[28px] p-7">
            <h3 className="text-[1.15rem] font-semibold tracking-[-0.02em]">{t}</h3>
            <p className="mt-2 text-[0.98rem] leading-relaxed text-white/65">{d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  const included = [
    "Stempler, henvisninger og beskeder",
    "Ubegrænset antal kortholdere",
    "Dit eget design, intet logo fra os",
    "Tilbud og kampagner",
    "Statistik, uge for uge",
  ];
  return (
    <section id="pris" className="scroll-mt-4 bg-white py-24 sm:py-32">
      <SectionHead title="Tre måneder gratis. Derefter 49 kr. om måneden." text="Ubegrænset antal kortholdere." />
      <div className="mx-auto mt-14 max-w-[560px] px-4 sm:px-6">
        <div className="kk-reveal kk-dark rounded-[28px] p-8 sm:p-10">
          <Lights />
          <p className="text-[15px] font-semibold">Folka Kort</p>
          <p className="mt-3 flex items-baseline gap-2">
            <span className="text-[3.4rem] font-semibold leading-none tracking-[-0.04em]">49 kr.</span>
            <span className="text-[15px] text-white/60">om måneden</span>
          </p>
          <p className="mt-2 text-[14px] text-white/60">De første tre måneder er gratis. Prisen er ekskl. moms.</p>
          <ul className="mt-7 grid gap-2.5 text-[0.98rem] text-white/85">
            {included.map((f) => (
              <li key={f} className="flex gap-2.5">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#7CC4FF]" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/start"
            className="mt-8 flex justify-center rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Opret dit kort gratis
          </Link>
          <p className="mt-4 text-center text-[13px] text-white/55">Ingen binding. Intet opstartsgebyr. Intet betalingskort.</p>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="kk-dark py-24 text-center sm:py-32">
      <Lights />
      <div className="mx-auto max-w-[44rem] px-4 sm:px-6">
        <h2 className="kk-reveal text-[clamp(2.2rem,5.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
          Dit kort kan være klar i dag.
        </h2>
        <p className="mx-auto mt-5 max-w-[30rem] text-[1.06rem] leading-relaxed text-white/65">
          Lav dit kort på et minut. Hæng QR-koden op, og de første kunder har det i Wallet samme dag.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/start" className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#061C3D] transition-transform hover:scale-[1.03] active:scale-[0.98]">
            Opret dit kort gratis
          </Link>
          <Link href="/prøv" className="kk-glass-pill px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-white/15">
            Prøv kortet først
          </Link>
        </div>
        <p className="mt-6 text-[14px] text-white/55">
          Har du allerede et kort?{" "}
          <Link href="/login" className="font-medium text-white underline-offset-4 hover:underline">
            Log ind
          </Link>
        </p>
      </div>
    </section>
  );
}

export function KundekortPage() {
  return (
    <div className={`kk ${inter.variable}`}>
      <Header />
      <main>
        <Hero />
        <Trades />
        <StorySection />
        <Gallery />
        <Features />
        <Security />
        <Pricing />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
