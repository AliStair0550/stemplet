import Link from "next/link";
import { ButtonLink } from "@/components/ui";
import { CTA, CtaArrow, IconQr, IconShare, IconStamp } from "./icons";

// Foerste-gangs-guide: gOr det tydeligt at der er TO veje i gang (fysisk QR i
// butikken + deling online) og forklarer helt konkret hvordan man stempler og
// giver personalet adgang. Vises paa overblikket indtil foerste stempel, og
// altid via menupunktet "Kom i gang".
export function GettingStarted({ slug }: { slug: string }) {
  const stampSteps = [
    "Kunden viser sit stempelkort fra sin Wallet.",
    "Åbn Stempel og scan QR-koden på kortet.",
    "Stemplet lander på kundens kort med det samme.",
  ];
  const label =
    "text-[0.68rem] font-[500] uppercase tracking-[0.16em] text-terracotta";
  const iconWrap =
    "flex h-10 w-10 items-center justify-center rounded-full bg-terracotta/10 text-terracotta";
  return (
    <div className="overflow-hidden rounded-lg border border-terracotta/30 bg-white shadow-card">
      <div className="border-b border-fog bg-terracotta/[0.05] px-6 py-5 md:px-8">
        <h2 className="font-[400] text-[1.2rem] text-ink">Kom godt i gang</h2>
        <p className="mt-1.5 max-w-xl font-[300] text-[0.9rem] leading-relaxed text-stone">
          Der er to måder at få kunderne i gang. Brug den ene eller begge, det
          tager få minutter.
        </p>
      </div>

      {/* Foerst: tjek at kortet ser rigtigt ud, foer det printes/deles */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-fog bg-parchment/50 px-6 py-4 md:px-8">
        <span className="font-[300] text-[0.86rem] leading-relaxed text-stone">
          <span className="font-[500] text-ink">Først:</span> tjek at dit kort
          ser rigtigt ud, navn, farver, belønning og antal stempler.
        </span>
        <Link href="/app/kort" className={CTA}>
          Se og ret dit kort
          <CtaArrow />
        </Link>
      </div>

      {/* De to veje: fysisk QR i butikken, eller deling online */}
      <div className="grid gap-px bg-fog sm:grid-cols-2">
        <div className="flex flex-col gap-3 bg-white p-6 md:p-7">
          <div className="flex items-center gap-3">
            <span className={iconWrap}>
              <IconQr />
            </span>
            <span className={label}>Vej 1 · I butikken</span>
          </div>
          <span className="font-[400] text-[1.05rem] text-ink">
            Sæt din QR op ved kassen
          </span>
          <span className="font-[300] text-[0.85rem] leading-relaxed text-stone">
            Print plakaten med din QR-kode og hæng den op. Kunderne scanner den
            og henter stempelkortet direkte i deres Wallet.
          </span>
          <div className="mt-auto pt-2">
            <ButtonLink href="/app/materialer" variant="outline" size="md">
              Hent QR og skilte til print
            </ButtonLink>
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-white p-6 md:p-7">
          <div className="flex items-center gap-3">
            <span className={iconWrap}>
              <IconShare />
            </span>
            <span className={label}>Vej 2 · Online</span>
          </div>
          <span className="font-[400] text-[1.05rem] text-ink">
            Del kortet på sociale medier
          </span>
          <span className="font-[300] text-[0.85rem] leading-relaxed text-stone">
            Læg kortet på Instagram eller Facebook. Kunderne henter det
            hjemmefra og har det klar ved næste besøg.
          </span>
          <div className="mt-auto pt-2">
            <ButtonLink href="/app/kampagner" variant="outline" size="md">
              Del kortet
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* Sådan giver du et stempel + selvtest + adgang til personalet */}
      <div className="border-t border-fog px-6 py-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <IconStamp />
          </span>
          <span className="font-[400] text-[1rem] text-ink">
            Sådan giver du et stempel
          </span>
        </div>
        <ol className="mt-4 grid gap-3 sm:grid-cols-3">
          {stampSteps.map((t, i) => (
            <li
              key={t}
              className="flex gap-2.5 text-[0.85rem] font-[300] leading-relaxed text-stone"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-terracotta/10 font-fraunces text-[0.8rem] italic text-terracotta">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-md border border-terracotta/20 bg-terracotta/[0.04] px-4 py-3">
          <p className="font-[300] text-[0.84rem] leading-relaxed text-stone">
            <span className="font-[500] text-ink">Prøv det selv:</span> hent
            kortet på din egen telefon og giv dig selv det første stempel, så
            ved du præcis, hvad kunden oplever.{" "}
            <Link
              href={`/k/${slug}`}
              target="_blank"
              rel="noreferrer"
              className="text-terracotta underline underline-offset-2 hover:opacity-70"
            >
              Se kundens side
            </Link>
          </p>
        </div>

        <div className="mt-5">
          <ButtonLink href="/app/kasse" variant="primary" size="md">
            Åbn Stempel
          </ButtonLink>
        </div>

        <p className="mt-4 font-[300] text-[0.84rem] leading-relaxed text-stone">
          Skal personalet også kunne stemple?{" "}
          <Link
            href="/app/indstillinger#kasse-enheder"
            className="text-terracotta underline underline-offset-2 hover:opacity-70"
          >
            Par en kasse-enhed
          </Link>{" "}
          så de får adgang uden dit login. Personale-PIN&apos;en bruges kun, når
          en kunde indløser en fuld belønning, ikke til at give stempler.
        </p>
      </div>
    </div>
  );
}
