import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import HeroStampCard from "@/components/marketing/HeroStampCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-16 h-[460px] w-[460px] rounded-full bg-terracotta/[0.07] blur-[120px]"
      />
      <Container className="relative">
        {/* Mobil: eyebrow oeverst, saa selve stempelkortet (lidt mindre), saa
            overskrift + CTA'er. Saa moedes man af kortet med det samme. Desktop:
            to kolonner (tekst til venstre, kort til hoejre) praecis som foer. */}
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-center md:gap-12">
          {/* Eyebrow, kun mobil (oeverst) */}
          <div className="animate-fade-up md:hidden">
            <Eyebrow>Det digitale stempelkort</Eyebrow>
          </div>

          {/* Stempelkortet: mobil nr. 2, desktop hoejre kolonne */}
          <div className="flex animate-fade-up justify-center delay-100 md:order-2 md:mt-20 md:justify-end">
            <HeroStampCard />
          </div>

          {/* Overskrift + tekst + CTA'er: mobil nr. 3, desktop venstre kolonne.
              Eyebrow gentages her, men vises kun paa desktop. */}
          <div className="min-w-0 animate-fade-up delay-200 md:order-1">
            <div className="hidden md:block">
              <Eyebrow>Det digitale stempelkort</Eyebrow>
            </div>
            <h1 className="text-[2.7rem] font-bold leading-[1.04] tracking-[-0.04em] text-ink md:mt-6 md:text-[3.7rem]">
              Stempelkortet, der skaber{" "}
              <span className="text-terracotta">flere gensyn.</span>
            </h1>
            <p className="mt-6 max-w-md text-[1.05rem] leading-[1.6] text-taupe">
              Den klassiske loyalitetsidé får nu et digitalt hjem. Altid ved
              hånden i Apple Wallet. Ingen app. Ingen tilmelding. Indsigt i
              statistik og købsmønstre. Dine første 100 kunder er gratis.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <ButtonLink href="/start" variant="primary" size="lg">
                Kom gratis i gang
              </ButtonLink>
              <ButtonLink href="#sådan" variant="outline" size="lg">
                Se hvordan det virker
              </ButtonLink>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
