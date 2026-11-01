import Image from "next/image";
import { Footer, LightHeader } from "@/components/kundekort/SiteChrome";
import { Section, Container, Eyebrow } from "@/components/ui";
import Link from "next/link";
import { BRANCHER, type BrancheContent } from "@/lib/brancher";
import { WalletCardPreview } from "@/components/WalletCardPreview";
import { StampIcon } from "@/components/StampIcon";
import { BrancheStamps } from "@/components/marketing/BrancheStamps";
import { BrancheExamples } from "@/components/marketing/BrancheExamples";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { NewsletterSection } from "@/components/marketing/NewsletterSection";

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
    // Folka-udtrykket (Inter, natteblaa) via .dash-theme, se DESIGN.md.
    <div className="dash-theme min-h-screen bg-parchment">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <LightHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden pt-16 pb-14 md:pt-24 md:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 h-[460px] w-[780px] max-w-[110vw] -translate-x-1/2 rounded-full bg-[#1B5EAE]/[0.08] blur-[130px]"
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

        {/* Mere end stempler: henvisninger og beskeder, med eksempler fra branchen. */}
        <Section>
          <div className="mx-auto max-w-[960px]">
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow>Mere end stempler</Eyebrow>
              <h2 className="mt-4 text-balance text-[1.8rem] font-bold leading-[1.1] tracking-[-0.03em] text-ink md:text-[2.3rem]">
                Kortet skaffer også nye kunder og fylder dagen.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              <div className="flex flex-col rounded-[24px] bg-white p-7 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F0FB] text-[#1B5EAE]">
                  <StampIcon icon="heart" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.025em] text-ink">Lad kunderne anbefale dig</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-stone">
                  Kunden deler sin kode fra kortet. Vennen får {b.referral.friend} første gang, og kunden får {b.referral.reward}, når vennen har været der.
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-6" aria-hidden>
                  <span className="rounded-full bg-[#061C3D] px-4 py-2 text-[14px] font-semibold text-white">Din kunde</span>
                  <span className="text-[14px] text-[#8D98A8]">deler</span>
                  <span className="rounded-full bg-[#E8F0FB] px-4 py-2 text-[14px] font-semibold text-[#1B5EAE]">Ny kunde i døren</span>
                </div>
              </div>
              <div className="flex flex-col rounded-[24px] bg-white p-7 shadow-card">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#E8F0FB] text-[#1B5EAE]">
                  <StampIcon icon="sparkle" className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-[1.3rem] font-semibold tracking-[-0.025em] text-ink">Din besked lander på låseskærmen</h3>
                <p className="mt-2 text-[0.98rem] leading-relaxed text-stone">
                  Skriv en kort besked, og den lander hos alle med kortet. Ingen mailliste og ingen annoncer.
                </p>
                {/* Notifikation som paa en iPhone. */}
                <div className="mt-auto pt-6" aria-hidden>
                  <div className="rounded-[18px] bg-[#F2F5F9] p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-[7px] text-white" style={{ background: b.cardExample?.primaryColor ?? "#061C3D" }}>
                        <StampIcon icon={b.cardExample?.stampIcon ?? "coffee"} className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-[12.5px] font-semibold text-[#0B1628]">{b.cardExample?.businessName ?? b.shortName}</span>
                      <span className="ml-auto text-[11px] text-[#5F6B7E]">nu</span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-snug text-[#384354]">{b.message}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Inspiration til belOnninger: levende, maalrettede eksempler + CTA */}
        <Section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1B5EAE]/[0.08] blur-[120px]"
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
              Sæt dit eget kort op på få minutter. Ingen app, ingen binding, tre
              måneder gratis.
            </p>
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
                  {/* Kortet, som det ser ud i kundens Wallet (samme som i dashboardet). */}
                  <div className="w-full max-w-[300px]">
                    <WalletCardPreview
                      os="27"
                      style="stamps"
                      artwork={null}
                      primaryColor={b.cardExample.primaryColor}
                      textColor={b.cardExample.textColor}
                      logoUrl={null}
                      name={b.cardExample.businessName}
                      stampIcon={b.cardExample.stampIcon}
                      stampsRequired={b.cardExample.required}
                      rewardText={b.cardExample.rewardText}
                      product="begge"
                      friendReward={b.referral.friend}
                      referrerReward={b.referral.reward}
                      actions={[]}
                      sampleStamps={b.cardExample.stamps}
                      hideQr
                    />
                  </div>
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
            <div className="mt-8">
              <FaqAccordion items={b.faq} />
            </div>
          </div>
        </Section>

        {/* Andre brancher: siderne linker til hinanden. */}
        <Section>
          <div className="mx-auto max-w-[760px] text-center">
            <h2 className="text-[1.3rem] font-bold tracking-[-0.02em] text-ink">Andre brancher</h2>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {BRANCHER.filter((o) => o.slug !== b.slug).map((o) => (
                <Link
                  key={o.slug}
                  href={o.slug}
                  className="rounded-full border border-clay bg-white px-4 py-2 text-[0.9rem] font-medium text-ink transition-colors hover:border-ink"
                >
                  {o.shortName}
                </Link>
              ))}
            </div>
          </div>
        </Section>

        {/* Hold mig orienteret: kilde = branchens slug */}
        <NewsletterSection source={b.slug} />
      </main>
      <Footer />
    </div>
  );
}
