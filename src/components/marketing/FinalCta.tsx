import { ButtonLink, Container } from "@/components/ui";

export default function FinalCta() {
  return (
    <section className="bg-forest py-24 text-parchment md:py-32">
      <Container className="flex flex-col items-center text-center">
        <span className="font-[400] text-[0.65rem] uppercase tracking-[0.12em] text-parchment/60">
          Kom i gang
        </span>
        <h2 className="mt-5 max-w-2xl font-[300] text-[2rem] leading-[1.25] tracking-[0.02em] text-parchment md:text-[2.6rem]">
          Dine kunder er her allerede. Nu mangler de bare{" "}
          <span className="font-fraunces font-light italic">dit kort</span>.
        </h2>
        <p className="mt-6 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-parchment/70">
          Opret dit første stempelkort på få minutter. Gratis at starte, ingen
          binding.
        </p>
        <div className="mt-10">
          <ButtonLink href="/start" variant="moss" size="lg">
            Kom gratis i gang
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
