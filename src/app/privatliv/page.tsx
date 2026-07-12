import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Privatlivspolitik",
  description: "Sådan behandler Stemplet personoplysninger.",
};

// TODO (juridisk): indsæt CVR-nummer og fysisk adresse for Alius, og faa
// politikken gennemgaaet af en advokat inden endelig brug.
const CONTACT = "hej@alius.dk";

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-moss" />
      <span>{children}</span>
    </li>
  );
}

export default function PrivatlivPage() {
  return (
    <LegalLayout
      title="Privatlivspolitik"
      updated="12. juli 2026"
      intro="Stemplet er et digitalt stempelkort fra Alius. Vi behandler så få oplysninger som muligt, og vi sælger dem aldrig. Her kan du læse, hvad vi indsamler, hvorfor, og hvilke rettigheder du har."
    >
      <LegalSection title="1. Hvem er ansvarlig">
        <p>
          Stemplet drives af Alius. Har du spørgsmål om dine oplysninger, eller
          vil du gøre brug af dine rettigheder, kan du skrive til os på{" "}
          <a href={`mailto:${CONTACT}`} className="text-moss underline underline-offset-2">
            {CONTACT}
          </a>
          .
        </p>
        <p>
          For en butiks egne kunder er det <strong>butikken</strong>, der er
          dataansvarlig for kundeoplysningerne. Stemplet er butikkens
          databehandler og behandler kun oplysningerne efter butikkens
          instruks. Se vores{" "}
          <Link href="/databehandleraftale" className="text-moss underline underline-offset-2">
            databehandleraftale
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="2. Hvilke oplysninger vi behandler">
        <p>Afhængigt af, hvordan du bruger Stemplet:</p>
        <ul className="flex flex-col gap-2.5">
          <Li>
            <strong>Virksomhedskonto:</strong> navn og e-mail, så du kan logge
            ind og administrere din butik.
          </Li>
          <Li>
            <strong>Stempelkort (på butikkens vegne):</strong> et serienummer,
            antal stempler, tidspunkter og en valgfri e-mail, hvis kunden selv
            oplyser den. En kunde kan bruge kortet helt anonymt.
          </Li>
          <Li>
            <strong>Teknisk og sikkerhed:</strong> IP-adresse og en hændelseslog
            over stempler og indløsninger. Det bruges kun til at forebygge
            snyd og misbrug.
          </Li>
          <Li>
            <strong>Betaling:</strong> hvis din butik opgraderer, håndteres
            kortbetaling af Stripe. Vi gemmer aldrig dine kortoplysninger.
          </Li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Formål og retsgrundlag">
        <ul className="flex flex-col gap-2.5">
          <Li>
            At levere tjenesten, herunder at give og indløse stempler
            (opfyldelse af aftale, databeskyttelsesforordningens art. 6, stk. 1,
            litra b).
          </Li>
          <Li>
            At beskytte tjenesten mod snyd og misbrug (vores og butikkens
            legitime interesse, art. 6, stk. 1, litra f).
          </Li>
          <Li>
            At sende dig et login-link, når du beder om at logge ind (opfyldelse
            af aftale).
          </Li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Cookies">
        <p>
          Vi bruger kun de cookies, der får tjenesten til at virke: en cookie,
          der genkender kundens stempelkort på telefonen, og en login-session
          for butiksejere. Vi bruger ingen cookies til reklame eller sporing på
          tværs af sider.
        </p>
      </LegalSection>

      <LegalSection title="5. Hvor længe vi gemmer">
        <p>
          Vi gemmer oplysningerne, så længe kontoen eller kortet er aktivt.
          Hændelseslog og tekniske oplysninger opbevares kun kortvarigt af
          sikkerhedshensyn. Du kan altid bede os om at slette dine oplysninger.
        </p>
      </LegalSection>

      <LegalSection title="6. Databehandlere og opbevaringssted">
        <p>
          Selve databasen ligger i EU (Frankfurt), og vores servere kører i
          EU-regionen. Vi bruger enkelte betroede underleverandører:
        </p>
        <ul className="flex flex-col gap-2.5">
          <Li>Neon og Vercel, database og drift i EU.</Li>
          <Li>Upstash, midlertidig cache og sikkerhed.</Li>
          <Li>Resend, udsendelse af login-mails (USA).</Li>
          <Li>Stripe, betaling ved opgradering (kun hvis aktivt).</Li>
        </ul>
        <p>
          Enkelte underleverandører behandler oplysninger i USA. Det sker på
          grundlag af EU-Kommissionens standardkontraktbestemmelser (SCC), så
          dine oplysninger er beskyttet på et niveau svarende til EU.
        </p>
      </LegalSection>

      <LegalSection title="7. Dine rettigheder">
        <p>Efter databeskyttelsesreglerne har du ret til at:</p>
        <ul className="flex flex-col gap-2.5">
          <Li>få indsigt i de oplysninger, vi har om dig,</Li>
          <Li>få rettet forkerte oplysninger,</Li>
          <Li>få slettet dine oplysninger,</Li>
          <Li>gøre indsigelse mod eller begrænse behandlingen,</Li>
          <Li>få dine oplysninger udleveret (dataportabilitet).</Li>
        </ul>
        <p>
          Skriv til{" "}
          <a href={`mailto:${CONTACT}`} className="text-moss underline underline-offset-2">
            {CONTACT}
          </a>
          . Er du utilfreds med vores behandling, kan du klage til Datatilsynet
          (datatilsynet.dk).
        </p>
      </LegalSection>

      <LegalSection title="8. Ændringer">
        <p>
          Vi opdaterer politikken, hvis tjenesten ændrer sig. Den nyeste version
          ligger altid her med dato for seneste opdatering øverst.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
