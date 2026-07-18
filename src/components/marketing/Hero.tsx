import { ButtonLink, Container, Eyebrow, CtaGlow } from "@/components/ui";
import HeroStampCard from "@/components/marketing/HeroStampCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-16 h-[460px] w-[460px] rounded-full bg-terracotta/[0.07] blur-[120px]"
      />
      <Container className="relative">
        {/* Mobil (eén kolonne): eyebrow + overskrift, saa selve stempelkortet,
            saa tekst + CTA'er. Desktop: to kolonner, hvor venstre har overskrift
            (raekke 1) og tekst (raekke 2), og kortet staar centreret til hoejre. */}
        <div className="flex flex-col gap-8 md:grid md:grid-cols-2 md:items-center md:gap-x-12 md:gap-y-6">
          {/* Eyebrow + overskrift */}
          <div className="animate-fade-up md:col-start-1 md:row-start-1">
            <Eyebrow>Det digitale stempelkort</Eyebrow>
            <h1 className="mt-5 text-[2.7rem] font-bold leading-[1.04] tracking-[-0.04em] text-ink md:mt-6 md:text-[3.7rem]">
              Stempelkortet, der skaber{" "}
              <span className="text-terracotta">flere gensyn.</span>
            </h1>
          </div>

          {/* Stempelkortet: mobil under overskriften, desktop hoejre kolonne */}
          <div className="flex animate-fade-up justify-center delay-100 md:col-start-2 md:row-span-2 md:row-start-1 md:justify-end">
            <HeroStampCard />
          </div>

          {/* Tekst + CTA'er */}
          <div className="min-w-0 animate-fade-up delay-200 md:col-start-1 md:row-start-2">
            <p className="max-w-md text-[1.05rem] leading-[1.6] text-taupe">
              Den klassiske loyalitetsidé får nu et digitalt hjem. Altid ved
              hånden i Apple Wallet. Ingen app. Ingen tilmelding. Indsigt i
              statistik og købsmønstre.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <CtaGlow className="w-full sm:w-auto">
                <ButtonLink
                  href="/start"
                  variant="primary"
                  size="lg"
                  className="group w-full sm:w-auto"
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
              <ButtonLink href="#sådan" variant="outline" size="lg">
                Sådan virker det
              </ButtonLink>
            </div>
            <p className="mt-7 text-[0.85rem] text-taupe-light">
              Dine første 100 kunder er gratis. Intet kreditkort.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
