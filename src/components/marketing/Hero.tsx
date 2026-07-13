import { ButtonLink, Container, Eyebrow } from "@/components/ui";
import HeroStampCard from "@/components/marketing/HeroStampCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-8%] top-16 h-[460px] w-[460px] rounded-full bg-moss/10 blur-[120px]"
      />
      <Container className="relative">
        <div className="grid items-center gap-14 md:grid-cols-2 md:gap-12">
          <div className="animate-fade-up">
            <Eyebrow>Det digitale stempelkort</Eyebrow>
            <h1 className="mt-6 font-[300] text-[2.5rem] leading-[1.2] tracking-[0.01em] text-ink md:text-[3.1rem]">
              Stempelkortet, der skaber{" "}
              <span className="inline-block whitespace-nowrap pb-[0.08em] font-fraunces font-[400] italic leading-[1.1]">
                flere gensyn.
              </span>
            </h1>
            <p className="mt-6 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
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

          <div className="flex animate-fade-up justify-center delay-200 md:mt-20 md:justify-end">
            <HeroStampCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
