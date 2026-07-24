import Image from "next/image";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import {
  Section,
  Container,
  Eyebrow,
  ButtonLink,
  CtaGlow,
} from "@/components/ui";
import { FREE_CUSTOMER_LIMIT } from "@/lib/plans";
import { type BrancheContent } from "@/lib/brancher";
import { StampCard } from "@/components/StampCard";
import { BrancheStamps } from "@/components/marketing/BrancheStamps";
import { BrancheExamples } from "@/components/marketing/BrancheExamples";

// Faelles skabelon for en brancheside. Ren server-komponent i sitets designsystem:
// hero (eyebrow + H1 + intro + stempel-animation), brodtekst-sektioner, et konkret
// kort-eksempel (hvis defineret), FAQ med FAQPage structured data og en CTA med
// levende, maalrettede eksempler.
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
  // Skiftende sektions-baggrunde (parchment <-> sand), saa der er tydelig kontrast
  // fra sektion til sektion. Kort-eksemplet er valgfrit, saa FAQ/CTA regnes ud, saa
  // to nabosektioner aldrig har samme farve.
  const hasCard = !!b.cardExample;

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

        {/* Stemnings-billede (kun hvis branchen har defineret et): en tegning fra
            branchen, saa siden faar mere "branchefoelelse". */}
        {b.sceneImage ? (
          <div className="overflow-x-clip pb-20 md:pb-24">
            <Container>
              <figure className="mx-auto max-w-3xl">
                <div className="overflow-hidden rounded-[1.5rem] shadow-card ring-1 ring-ink/[0.06]">
                  <Image
                    src={b.sceneImage.src}
                    alt={b.sceneImage.alt}
                    width={1440}
                    height={960}
                    sizes="(max-width: 768px) 100vw, 768px"
                    className="h-auto w-full"
                  />
                </div>
                {b.sceneImage.caption ? (
                  <figcaption className="mt-4 text-center text-[0.92rem] font-[300] italic text-stone">
                    {b.sceneImage.caption}
                  </figcaption>
                ) : null}
              </figure>
            </Container>
          </div>
        ) : null}

        {/* Brodtekst-sektioner */}
        <Section className="bg-sand">
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
                {s.list ? (
                  <ul className="flex flex-col gap-2.5">
                    {s.list.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-3 text-[1.02rem] leading-[1.6] text-stone"
                      >
                        <span
                          aria-hidden
                          className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {s.outro?.map((p, i) => (
                  <p key={i} className="text-[1.02rem] leading-[1.75] text-stone">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </Section>

        {/* Inspiration til belOnninger: levende, maalrettede eksempler + CTA */}
        <Section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.06] blur-[120px]"
          />
          <div className="relative mx-auto max-w-2xl text-center">
            <Eyebrow>Inspiration til belønninger</Eyebrow>
            <h2 className="mt-4 text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.035em] text-ink md:text-[2.7rem]">
              Din næste stamkunde starter med ét stempel.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-[1.6] text-stone">
              Belønningen er altid dit valg. Et par eksempler:
            </p>
            <BrancheExamples examples={b.examples} />
            <p className="mx-auto mt-7 max-w-md text-[1rem] leading-[1.7] text-stone">
              Sæt dit eget kort op på få minutter. Ingen app, ingen binding, gratis
              op til {FREE_CUSTOMER_LIMIT} kortholdere.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
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
        {/* Konkret kort-design-eksempel (kun hvis branchen har defineret et) */}
        {b.cardExample ? (
          <Section className="bg-sand">
              <div className="mx-auto max-w-[680px] text-center">
                <Eyebrow>Et eksempel</Eyebrow>
                <h2 className="mt-3 text-[1.6rem] font-bold leading-[1.15] tracking-[-0.025em] text-ink md:text-[2rem]">
                  Sådan kunne dit kort se ud
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[1rem] leading-[1.7] text-stone">
                  Tilpas farver og belønning til dit brand. Kunden har det i
                  Apple Wallet, altid ved hånden.
                </p>
                <div className="mt-10 flex justify-center">
                  <StampCard
                    businessName={b.cardExample.businessName}
                    primaryColor={b.cardExample.primaryColor}
                    textColor={b.cardExample.textColor}
                    stampIcon={b.cardExample.stampIcon}
                    stamps={b.cardExample.stamps}
                    required={b.cardExample.required}
                    rewardText={b.cardExample.rewardText}
                    shine
                    className="w-full max-w-[21rem]"
                  />
                </div>
              </div>
            </Section>
        ) : null}

        {/* FAQ */}
        <Section className={hasCard ? undefined : "bg-sand"}>
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

      </main>
      <Footer />
    </>
  );
}
