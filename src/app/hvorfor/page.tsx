import type { Metadata } from "next";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { StampDemo } from "@/components/marketing/WhyInteractive";
import {
  Section,
  Container,
  ButtonLink,
  CtaGlow,
  Divider,
  WalletIcon,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Fordele",
  description:
    "Det klassiske stempelkort, bygget til den moderne forretning. Ti grunde til, at din butik får flere gensyn med et digitalt stempelkort i Apple Wallet.",
  openGraph: {
    title: "Fordele - stempelkortet, der skaber flere gensyn",
    description:
      "Ti grunde til, at din butik skal vælge det digitale stempelkort i Apple Wallet.",
    type: "website",
  },
};

const ICON_CLS = "h-5 w-5";
function PointIcon({ name }: { name: string }) {
  const c = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: ICON_CLS,
  };
  switch (name) {
    case "users":
      return (
        <svg {...c}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 5.2a3.2 3.2 0 0 1 0 5.6M17.5 19a5.5 5.5 0 0 0-3-4.9" />
        </svg>
      );
    case "wallet":
      return <WalletIcon className={ICON_CLS} />;
    case "qr":
      return (
        <svg {...c}>
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <path d="M14 14h3v3M20 14v.01M17 20h3v-3M14 20h.01" />
        </svg>
      );
    case "chart":
      return (
        <svg {...c}>
          <path d="M4 19h16" />
          <rect x="5.5" y="11" width="3" height="6" rx="1" />
          <rect x="10.5" y="7" width="3" height="10" rx="1" />
          <rect x="15.5" y="13" width="3" height="4" rx="1" />
        </svg>
      );
    case "phone":
      return (
        <svg {...c}>
          <rect x="6.5" y="3" width="11" height="18" rx="2.5" />
          <path d="M10.5 6h3M11 18h2" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...c}>
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
          <path d="M7 5H4.5a2.5 2.5 0 0 0 3 2.6M17 5h2.5a2.5 2.5 0 0 1-3 2.6" />
          <path d="M12 13v3M8.5 20h7l-1-4h-5Z" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...c}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="M18.6 15.4l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5.5-1.5Z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...c}>
          <path d="M13 3 5 13h6l-1 8 8-11h-6l1-7Z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...c}>
          <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
          <path d="M9.6 11.3v-1a2.4 2.4 0 0 1 4.8 0v1" />
          <rect x="9" y="11.3" width="6" height="4.4" rx="1" />
        </svg>
      );
    case "gift":
      return (
        <svg {...c}>
          <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
          <path d="M12 11v9M3 8h18v3H3zM12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8" />
        </svg>
      );
    default:
      return <svg {...c} />;
  }
}

const POINTS: { icon: string; title: string; body: string }[] = [
  {
    icon: "users",
    title: "Få flere stamkunder",
    body: "Stemplet gør det nemt at belønne dine stamkunder, så de har en ekstra grund til at vælge dig næste gang.",
  },
  {
    icon: "wallet",
    title: "Kortet er altid lige ved hånden",
    body: "Stempelkortet ligger i Apple Wallet, side om side med betalingskortet. Din butik er med i lommen, hver dag.",
  },
  {
    icon: "qr",
    title: "Ingen app. Hurtig oprettelse.",
    body: "Kunden scanner en QR-kode og har stempelkortet direkte i Apple Wallet. Ingen download. Klar på få minutter.",
  },
  {
    icon: "chart",
    title: "Målbar loyalitet",
    body: "Følg udviklingen med statistik over kortholdere, stempler og belønninger. Viden, papkortet aldrig gav dig.",
  },
  {
    icon: "phone",
    title: "Papkort bliver væk. Det gør Stemplet ikke.",
    body: "Når papkortet forsvinder, gør stemplerne også, og dermed motivationen for at samle videre. Det digitale kort bliver på telefonen.",
  },
  {
    icon: "trophy",
    title: "Gør loyalitet til en leg",
    body: "Beløn dine mest loyale kunder ved at sætte milepæle, og overrask topscorerne med en ekstra belønning. Loyalitet må gerne være sjovt.",
  },
  {
    icon: "sparkle",
    title: "Et stempel, der føles magisk",
    body: "Stemplet vises med det samme på kundens telefon. En lille oplevelse, der gør loyalitet synlig og giver lyst til at komme igen.",
  },
  {
    icon: "bolt",
    title: "Klar på få minutter",
    body: "Personalet bruger den telefon, de allerede har. Ingen hardware. Ingen installation.",
  },
  {
    icon: "shield",
    title: "Bygget på sikkerhed",
    body: "Kun personalet kan stemple, og hvert kort er unikt og krypteret. Belønningerne går til dine rigtige stamkunder.",
  },
  {
    icon: "gift",
    title: "Kom i gang uden risiko",
    body: "Gratis op til 100 kortholdere. Derefter kun 99 kr. om måneden. Ingen binding.",
  },
];

export default function WhyPage() {
  return (
    <>
      <Nav />
      <main>
        {/* Hero: centreret, uden det svaevende kort, saa den ikke ligner forsiden */}
        <section className="relative overflow-hidden pt-32 pb-16 md:pt-44 md:pb-24">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-10 h-[520px] w-[820px] max-w-[110vw] -translate-x-1/2 rounded-full bg-terracotta/[0.07] blur-[130px]"
          />
          <Container className="relative">
            <div className="mx-auto flex max-w-3xl animate-fade-up flex-col items-center text-center">
              <h1 className="text-[2.05rem] font-bold leading-[1.08] tracking-[-0.035em] text-ink md:text-[3rem]">
                Det klassiske stempelkort.{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(105deg, #A6502E 44%, #E7B48F 50%, #A6502E 56%)",
                    backgroundSize: "260% 100%",
                    WebkitBackgroundClip: "text",
                    animation: "textShine 4.5s ease-in-out 1.2s infinite",
                  }}
                >
                  Bygget til den moderne forretning.
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-[1.05rem] leading-[1.65] text-taupe">
                10 grunde til, at dit stempelkort fortjener en opgradering.
              </p>
            </div>
          </Container>
        </section>

        <Divider />

        {/* De 10 selling points */}
        <div className="cv-section">
          <Section>
            <div className="max-w-xl">
              <h2 className="text-[2rem] font-bold leading-[1.12] tracking-[-0.035em] text-ink md:text-[2.5rem]">
                Alt det, papkortet aldrig kunne.
              </h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {POINTS.map((p) => (
                <article
                  key={p.title}
                  className="group flex flex-col gap-4 rounded-[20px] border border-ink/[0.08] bg-parchment p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift md:p-8"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta/10 text-terracotta transition-colors group-hover:bg-terracotta group-hover:text-parchment">
                    <PointIcon name={p.icon} />
                  </span>
                  <h3 className="text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-ink">
                    {p.title}
                  </h3>
                  <p className="text-[0.92rem] leading-[1.6] text-taupe">
                    {p.body}
                  </p>
                </article>
              ))}
            </div>
          </Section>
        </div>

        <Divider />

        {/* Interaktivt demo */}
        <div className="cv-section">
          <Section className="relative overflow-hidden bg-sand">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="text-[2rem] font-bold leading-[1.12] tracking-[-0.035em] text-ink md:text-[2.5rem]">
                Et stempel, der føles magisk.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[0.98rem] leading-[1.7] text-stone">
                Klik og se, hvordan et stempel lander på kortet. Det samme sker
                på kundens telefon, med det samme.
              </p>
            </div>
            <div className="mt-12">
              <StampDemo />
            </div>
          </Section>
        </div>

        {/* Afsluttende CTA: aaben og inspirerende, ingen kasse */}
        <div className="cv-section">
          <Section className="relative overflow-hidden">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.06] blur-[120px]"
            />
            <div className="relative mx-auto max-w-2xl text-center">
              <h2 className="text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.8rem]">
                Din næste stamkunde venter.
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[1rem] leading-[1.7] text-stone">
                Sæt dit eget stempelkort op på få minutter og giv kunderne en
                grund til at komme igen. Gratis op til 100 kortholdere, derefter
                kun 99 kr. om måneden. Ingen binding.
              </p>
              <div className="mt-9 flex justify-center">
                <CtaGlow>
                  <ButtonLink
                    href="/start"
                    variant="primary"
                    size="lg"
                    className="group"
                  >
                    Kom gratis i gang
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[1.05rem] w-[1.05rem] transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </ButtonLink>
                </CtaGlow>
              </div>
            </div>
          </Section>
        </div>
      </main>
      <Footer />
    </>
  );
}
