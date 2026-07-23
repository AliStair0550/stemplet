import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/site/Nav";
import Footer from "@/components/site/Footer";
import { Section, Container, Divider } from "@/components/ui";
import { BRANCHER } from "@/lib/brancher";

export const metadata: Metadata = {
  title: { absolute: "Stempelkort til din branche | Stemplet" },
  description:
    "Se hvordan et digitalt stempelkort i Apple Wallet virker i netop din type forretning. Vælg din branche.",
  alternates: { canonical: "/brancher" },
  openGraph: {
    title: "Stempelkort til din branche | Stemplet",
    description:
      "Se hvordan et digitalt stempelkort i Apple Wallet virker i netop din type forretning.",
    url: "/brancher",
    type: "website",
  },
};

export default function BrancherPage() {
  return (
    <>
      <Nav />
      <main>
        <section className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-20">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-8 h-[440px] w-[760px] max-w-[110vw] -translate-x-1/2 rounded-full bg-terracotta/[0.06] blur-[130px]"
          />
          <Container className="relative">
            <div className="mx-auto flex max-w-3xl animate-fade-up flex-col items-center text-center">
              <h1 className="text-balance text-[2rem] font-bold leading-[1.1] tracking-[-0.035em] text-ink md:text-[2.9rem]">
                Stempelkort til din branche.
              </h1>
              <p className="mt-6 max-w-xl text-[1.05rem] leading-[1.7] text-taupe">
                Vælg din branche og se, hvordan stempelkortet passer til netop
                din forretning.
              </p>
            </div>
          </Container>
        </section>

        <Divider />

        <Section>
          <div className="mx-auto grid max-w-[1040px] gap-5 sm:grid-cols-2 md:grid-cols-3">
            {BRANCHER.map((b) => (
              <Link
                key={b.slug}
                href={b.slug}
                className="group flex flex-col gap-2 rounded-[20px] border border-clay bg-white p-7 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-lift md:p-8"
              >
                <span className="text-[0.72rem] font-medium uppercase tracking-[0.1em] text-terracotta">
                  {b.shortName}
                </span>
                <span className="text-[1.2rem] font-bold leading-snug tracking-[-0.02em] text-ink">
                  {b.cardTeaser}
                </span>
                <span className="mt-1 text-[0.9rem] leading-relaxed text-stone">
                  {b.metaDescription}
                </span>
              </Link>
            ))}
            {/* Forberedt til flere brancher: fag som pizzeriaer, bagerier,
                caféer, blomsterbutikker, ølbarer og isbutikker skrives efter behov. */}
            <div className="flex items-center justify-center rounded-[20px] border border-dashed border-clay bg-parchment/50 p-7 text-center md:col-span-3 md:p-8">
              <span className="text-[0.9rem] leading-relaxed text-slate">
                Flere brancher er på vej. Er din ikke med endnu? Skriv til{" "}
                <a
                  href="mailto:hej@alius.dk"
                  className="text-terracotta underline underline-offset-2"
                >
                  hej@alius.dk
                </a>
                .
              </span>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </>
  );
}
