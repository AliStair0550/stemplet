import { Section } from "@/components/ui";
import { NewsletterSignup } from "@/components/marketing/NewsletterSignup";

// "Lad os holde kontakten": den fulde tilmeldingssektion (navn, butiksnavn, mail).
// Bruges paa forsiden (source="forside") og paa hver brancheside (source=slug).
// Fyldt clay-baand med hvidt panel, saa sektionen staar tydeligt baade mellem de
// lyse sektioner paa forsiden og lige over den moerke footer paa branchesiderne.
export function NewsletterSection({ source }: { source: string }) {
  return (
    <Section id="hold-kontakten" className="relative overflow-hidden bg-clay">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[380px] w-[680px] max-w-[110vw] -translate-x-1/2 -translate-y-1/2 rounded-full bg-terracotta/[0.07] blur-[120px]"
      />
      <div className="relative mx-auto max-w-xl">
        <div className="rounded-[1.5rem] border border-ink/[0.06] bg-white p-8 text-center shadow-card md:p-10">
          <h2 className="text-balance text-[1.7rem] font-bold leading-[1.12] tracking-[-0.03em] text-ink md:text-[2.1rem]">
            Lad os holde kontakten
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[1rem] leading-[1.7] text-stone">
            Få inspiration, idéer og nye muligheder. Ingen spam, kun gode idéer.
          </p>
          <div className="mt-7 text-left">
            <NewsletterSignup variant="full" source={source} />
          </div>
        </div>
      </div>
    </Section>
  );
}
