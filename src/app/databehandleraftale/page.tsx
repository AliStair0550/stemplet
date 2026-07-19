import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";
import { LegalCompanyInfo } from "@/components/site/LegalCompanyInfo";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Databehandleraftale",
  description:
    "Databehandleraftale mellem butikken (dataansvarlig) og Stemplet (databehandler).",
};

// Firmaoplysninger (CVR + adresse) styres eet sted i src/lib/company.ts.
const CONTACT = COMPANY.contactEmail;

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-terracotta" />
      <span>{children}</span>
    </li>
  );
}

export default function DpaPage() {
  return (
    <LegalLayout
      title="Databehandleraftale"
      updated="12. juli 2026"
      intro="Når din butik bruger Stemplet, behandler vi dine kunders oplysninger på dine vegne. Denne aftale beskriver, hvordan vi gør det, og gælder automatisk, når du opretter en butik. Butikken er dataansvarlig, og Alius (Stemplet) er databehandler."
    >
      <LegalSection title="1. Rammen">
        <p>
          Aftalen regulerer Stemplets behandling af personoplysninger på
          butikkens vegne og er en del af vilkårene for at bruge tjenesten. Ved
          uoverensstemmelse går denne aftale forud for øvrige vilkår om
          databehandling.
        </p>
      </LegalSection>

      <LegalSection title="2. Behandlingens formål og varighed">
        <p>
          Formålet er at drive butikkens digitale stempelkort: at udstede kort,
          registrere stempler, indløse belønninger og vise statistik.
          Behandlingen løber, så længe butikken bruger Stemplet.
        </p>
      </LegalSection>

      <LegalSection title="3. Kun efter instruks">
        <p>
          Vi behandler kun oplysningerne efter butikkens dokumenterede instruks,
          som den kommer til udtryk gennem brugen af tjenesten. Vi bruger aldrig
          butikkens kundeoplysninger til egne formål og sælger dem ikke.
        </p>
      </LegalSection>

      <LegalSection title="4. Kategorier af oplysninger og registrerede">
        <p>De registrerede er butikkens kunder. Vi behandler:</p>
        <ul className="flex flex-col gap-2.5">
          <Li>et serienummer, der identificerer kortet,</Li>
          <Li>antal stempler, indløsninger og tidspunkter,</Li>
          <Li>en valgfri e-mail, hvis kunden selv oplyser den,</Li>
          <Li>IP-adresse og en hændelseslog til sikkerhed.</Li>
        </ul>
        <p>
          Der behandles ingen følsomme oplysninger. En kunde kan bruge kortet
          anonymt.
        </p>
      </LegalSection>

      <LegalSection title="5. Sikkerhed">
        <p>
          Vi træffer passende tekniske og organisatoriske foranstaltninger,
          herunder kryptering under transport, adgangsstyring, hashing af
          personale-PIN, signerede engangskoder til stempling og adskillelse af
          data mellem butikker.
        </p>
      </LegalSection>

      <LegalSection title="6. Underdatabehandlere">
        <p>
          Butikken giver generel tilladelse til, at vi bruger betroede
          underdatabehandlere til drift af tjenesten:
        </p>
        <ul className="flex flex-col gap-2.5">
          <Li>Neon og Vercel, database og drift i EU,</Li>
          <Li>Upstash, midlertidig cache og sikkerhed,</Li>
          <Li>Resend, udsendelse af login-mails,</Li>
          <Li>Stripe, betaling ved opgradering.</Li>
        </ul>
        <p>
          Vi sikrer, at underdatabehandlere er underlagt de samme forpligtelser.
          Vi varsler i rimelig tid ved udskiftning, så butikken kan gøre
          indsigelse.
        </p>
      </LegalSection>

      <LegalSection title="7. Overførsel til tredjelande">
        <p>
          Data opbevares i EU. Enkelte underdatabehandlere behandler oplysninger
          i USA på grundlag af EU-Kommissionens standardkontraktbestemmelser
          (SCC).
        </p>
      </LegalSection>

      <LegalSection title="8. Bistand til butikken">
        <p>
          Vi bistår i rimeligt omfang butikken med at svare på henvendelser fra
          kunder (indsigt, sletning m.v.) og med sikkerhed. Får vi en henvendelse
          direkte fra en kunde, henviser vi til butikken.
        </p>
      </LegalSection>

      <LegalSection title="9. Brud på persondatasikkerheden">
        <p>
          Opdager vi et sikkerhedsbrud, der berører butikkens kundeoplysninger,
          underretter vi butikken uden unødig forsinkelse og hjælper med de
          oplysninger, der er nødvendige for butikkens egen håndtering.
        </p>
      </LegalSection>

      <LegalSection title="10. Sletning ved ophør">
        <p>
          Når butikken lukker sin konto, sletter vi kundeoplysningerne inden for
          rimelig tid, medmindre lovgivning kræver fortsat opbevaring.
        </p>
      </LegalSection>

      <LegalSection title="11. Kontakt">
        <p>
          Spørgsmål til aftalen eller behandlingen kan rettes til{" "}
          <a href={`mailto:${CONTACT}`} className="text-terracotta underline underline-offset-2">
            {CONTACT}
          </a>
          . Se også vores{" "}
          <Link href="/privatliv" className="text-terracotta underline underline-offset-2">
            privatlivspolitik
          </Link>
          .
        </p>
        <LegalCompanyInfo />
      </LegalSection>
    </LegalLayout>
  );
}
