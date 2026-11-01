import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";
import { LegalCompanyInfo } from "@/components/site/LegalCompanyInfo";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privatlivspolitik",
  description: "Hvad Folka Kort gemmer om dig, hvorfor, og hvad du selv bestemmer.",
  alternates: { canonical: "/privatliv" },
};

// Skrevet til kunden foerst: kort og i almindeligt dansk. Lovhenvisningerne
// staar samlet i een linje under "Hvorfor". Firmaoplysninger (CVR + adresse)
// styres eet sted i src/lib/company.ts.
// TODO (juridisk): faa politikken gennemgaaet af en advokat inden endelig brug.
const CONTACT = COMPANY.contactEmail;

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-terracotta" />
      <span>{children}</span>
    </li>
  );
}

const mail = (
  <a href={`mailto:${CONTACT}`} className="text-terracotta underline underline-offset-2">
    {CONTACT}
  </a>
);

export default function PrivatlivPage() {
  return (
    <LegalLayout
      title="Privatlivspolitik"
      updated="1. november 2026"
      intro="Folka Kort er det digitale loyalitetskort, du får hos din butik. Her står kort og klart, hvad der bliver gemt om dig, og hvad du selv bestemmer."
    >
      <LegalSection title="Kort fortalt">
        <ul className="flex flex-col gap-2.5">
          <Li>Butikken gemmer dit navn, din e-mail og dine stempler, så kortet virker.</Li>
          <Li>Vi sælger aldrig dine oplysninger til nogen.</Li>
          <Li>Du får kun mails fra butikken, hvis du selv har sagt ja.</Li>
          <Li>
            Vil du ikke have kortet mere, fjerner du det bare fra din telefon. Vil du også have slettet dine
            oplysninger, så sig det i butikken.
          </Li>
        </ul>
      </LegalSection>

      <LegalSection title="Hvem står bag">
        <p>
          Folka Kort er lavet af Folka. Det er butikken, der har ansvaret for oplysningerne om dig som kunde. Vi passer på
          dem for butikken og bruger dem kun, som butikken beder om (se{" "}
          <Link href="/databehandleraftale" className="text-terracotta underline underline-offset-2">
            databehandleraftalen
          </Link>
          ). Har du spørgsmål, kan du altid skrive til os på {mail}.
        </p>
        <LegalCompanyInfo />
      </LegalSection>

      <LegalSection title="Hvad vi gemmer">
        <p>Når du har et kort hos en butik:</p>
        <ul className="flex flex-col gap-2.5">
          <Li>
            <strong>Navn og e-mail</strong>, som du selv skriver, når du henter kortet. Så kan butikken kende dig ved
            kassen og hjælpe, hvis du mister kortet. Ældre kort kan være uden navn og e-mail.
          </Li>
          <Li>
            <strong>Dine stempler</strong>: hvor mange du har, og hvornår du fik dem, så du får din belønning.
          </Li>
          <Li>
            <strong>Henvisninger</strong>, hvis butikken bruger det: din kode, hvem du har henvist, og hvem der
            henviste dig, og de belønninger, du har fået. Deler du din kode, ser vennen dit fornavn.
          </Li>
          <Li>
            <strong>Dit ja til mails</strong>, hvis du har sat flueben, og hvornår du gjorde det.
          </Li>
          <Li>
            <strong>Beskeder på kortet</strong>: butikken kan sende korte beskeder til kortet, fx et tilbud. Du kan slå
            dem fra på bagsiden af kortet.
          </Li>
          <Li>
            <strong>Tekniske oplysninger</strong>: IP-adresse og en log over stempler og belønninger. Det bruges kun
            til at forhindre snyd.
          </Li>
        </ul>
        <p>
          Har du en butik på Folka Kort, gemmer vi også dit navn og din e-mail, så du kan logge ind. Butikker betaler
          mod faktura, så vi gemmer aldrig kortoplysninger.
        </p>
      </LegalSection>

      <LegalSection title="Hvorfor">
        <ul className="flex flex-col gap-2.5">
          <Li>For at kortet virker: stempler, belønninger og henvisninger, som du selv har valgt at være med i.</Li>
          <Li>For at butikken kan skrive til dig på mail, men kun hvis du har sagt ja. Du kan altid sige nej igen.</Li>
          <Li>For at forhindre snyd og misbrug.</Li>
          <Li>For at sende et login-link, når en butiksejer beder om det.</Li>
        </ul>
        <p className="text-[0.85rem] text-stone">
          Grundlaget i loven: aftale (GDPR art. 6, stk. 1, litra b), samtykke (litra a og markedsføringslovens § 10)
          og legitim interesse i at forhindre snyd (litra f).
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Kun dem, der får kortet til at virke: én, der genkender dit kort på telefonen, og én, der holder butiksejere
          logget ind. Ingen cookies til reklame eller sporing.
        </p>
      </LegalSection>

      <LegalSection title="Hvor længe">
        <p>
          Så længe kortet eller butikkens konto findes. Henvisninger og belønninger, der ikke bliver brugt, udløber
          efter den tid, butikken har valgt. Tekniske logs gemmes kun kort.
        </p>
      </LegalSection>

      <LegalSection title="Hvor oplysningerne ligger">
        <p>Databasen og vores servere ligger i EU (Frankfurt). Vi får hjælp af få, faste leverandører:</p>
        <ul className="flex flex-col gap-2.5">
          <Li>Neon og Vercel: database og drift i EU.</Li>
          <Li>Upstash: midlertidig lagring og sikkerhed.</Li>
          <Li>Resend: udsendelse af mails (USA).</Li>
        </ul>
        <p>
          Når en leverandør er i USA, sker det efter EU-Kommissionens standardkontrakter, så dine oplysninger er lige så
          godt beskyttet som i EU.
        </p>
      </LegalSection>

      <LegalSection title="Det bestemmer du">
        <p>
          Du kan altid se, rette eller få slettet dine oplysninger, sige nej til, at de bliver brugt, eller få dem
          udleveret. Sig det i butikken, eller skriv til {mail}. Er du utilfreds, kan du klage til Datatilsynet
          (datatilsynet.dk).
        </p>
      </LegalSection>

      <LegalSection title="Ændringer">
        <p>Ændrer vi noget, står den nye version altid her med datoen øverst.</p>
      </LegalSection>
    </LegalLayout>
  );
}
