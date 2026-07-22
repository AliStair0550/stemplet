import Link from "next/link";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import {
  Section,
  Container,
  Eyebrow,
  ButtonLink,
  CtaGlow,
  Divider,
} from "@/components/ui";
import { FREE_CUSTOMER_LIMIT, PRO_PRICE_DKK } from "@/lib/plans";
import { relatedBrancher, type BrancheContent } from "@/lib/brancher";
import { BrancheStamps } from "@/components/marketing/BrancheStamps";

// Faelles skabelon for en brancheside. Ren server-komponent i sitets designsystem:
// hero (eyebrow + H1 + intro), brodtekst-sektioner, FAQ med FAQPage structured
// data, prisblok, krydslinks til de andre brancher og en "Prøv det selv"-CTA.
export function BranchePage({ b }: { b: BrancheContent }) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: b.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const related = relatedBrancher(b.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Nav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 h-[460px] w-[780px] max-w-[110vw] -translate-x-1/2 rounded-full bg-terracotta/[0.06] blur-[130px]"
          />
          <Container className="relative">
            <div className="mx-auto flex max-w-3xl animate-fade-up flex-col items-center text-center">
              <Eyebrow>{b.eyebrow}</Eyebrow>
              <h1 className="mt-4 text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.9rem]">
                {b.h1}
              </h1>
              <div className="mt-6 flex max-w-2xl flex-col gap-4">
                {b.intro.map((p, i) => (
                  <p key={i} className="text-[1.05rem] leading-[1.7] text-taupe">
                    {p}
                  </p>
                ))}
              </div>
              <div className="mt-10">
                <BrancheStamps icon={b.stampIcon} />
              </div>
            </div>
          </Container>
        </section>

        <Divider />

        {/* Brodtekst-sektioner */}
        <Section>
          <div className="mx-auto flex max-w-[680px] flex-col gap-11">
            {b.sections.map((s) => (
              <div key={s.heading} className="flex flex-col gap-4">
                <h2 className="text-[1.5rem] font-bold leading-[1.2] tracking-[-0.025em] text-ink md:text-[1.85rem]">
                  {s.heading}
                </h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i} className="text-[1.02rem] leading-[1.75] text-stone">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Section>

        <Divider />

        {/* FAQ */}
        <Section className="bg-sand">
          <div className="mx-auto max-w-[680px]">
            <h2 className="text-[1.6rem] font-bold leading-[1.15] tracking-[-0.025em] text-ink md:text-[2rem]">
              Ofte stillede spørgsmål
            </h2>
            <dl className="mt-8 flex flex-col divide-y divide-clay">
              {b.faq.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="text-[1.02rem] font-[500] text-ink">{f.q}</dt>
                  <dd className="mt-2 text-[0.98rem] leading-[1.7] text-stone">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Section>

        {/* Prisblok */}
        <Section>
          <div className="mx-auto max-w-[680px] rounded-2xl border border-clay bg-parchment p-8 text-center md:p-10">
            <Eyebrow>Pris</Eyebrow>
            <p className="mt-3 text-[1.3rem] font-bold tracking-[-0.02em] text-ink md:text-[1.5rem]">
              Gratis op til {FREE_CUSTOMER_LIMIT} kortholdere.
            </p>
            <p className="mt-2 text-[0.98rem] leading-[1.7] text-stone">
              Derefter {PRO_PRICE_DKK} kr. om måneden ekskl. moms. Ingen binding.
            </p>
          </div>
        </Section>

        <Divider />

        {/* Krydslinks til de andre brancher */}
        <Section>
          <div className="mx-auto max-w-[680px]">
            <Eyebrow>Andre brancher</Eyebrow>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={r.slug}
                  className="group flex flex-col gap-1 rounded-xl border border-clay bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                >
                  <span className="text-[1.05rem] font-[500] text-ink">
                    {r.shortName}
                  </span>
                  <span className="text-[0.88rem] leading-relaxed text-stone">
                    {r.cardTeaser}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Section>

        {/* Afsluttende CTA: Prøv det selv */}
        <Section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.06] blur-[120px]"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.6rem]">
              Sæt dit eget stempelkort op på få minutter.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-[1rem] leading-[1.7] text-stone">
              Ingen app, ingen binding. Gratis op til {FREE_CUSTOMER_LIMIT}{" "}
              kortholdere.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <CtaGlow>
                <ButtonLink href="/start" variant="primary" size="lg">
                  Kom gratis i gang
                </ButtonLink>
              </CtaGlow>
              <ButtonLink href="/prøv" variant="outline" size="lg">
                Prøv det selv
              </ButtonLink>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
