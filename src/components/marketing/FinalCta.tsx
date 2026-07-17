import { ButtonLink, Container } from "@/components/ui";

export default function FinalCta() {
  return (
    <section className="bg-ink py-24 text-parchment md:py-32">
      <Container className="flex flex-col items-center text-center">
        <span className="text-label font-medium uppercase tracking-[0.08em] text-parchment/45">
          Kom i gang
        </span>
        <h2 className="mt-5 max-w-2xl text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-parchment md:text-[2.7rem]">
          Dine kunder er her allerede. Nu mangler de bare dit kort.
        </h2>
        <p className="mt-6 max-w-md text-[1.05rem] leading-[1.6] text-parchment/70">
          Opret dit første stempelkort på få minutter. Gratis at starte, ingen
          binding.
        </p>
        <div className="mt-10">
          <ButtonLink href="/start" variant="primary" size="lg">
            Kom gratis i gang
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
