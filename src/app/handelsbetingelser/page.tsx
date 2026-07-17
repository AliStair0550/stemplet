import type { Metadata } from "next";
import Link from "next/link";
import { LegalLayout, LegalSection } from "@/components/site/LegalLayout";

export const metadata: Metadata = {
  title: "Handelsbetingelser",
  description: "Vilkårene for at bruge Stemplet.",
};

// TODO (juridisk): indsæt CVR-nummer og adresse for Alius, bekraeft moms-forhold
// og faa betingelserne gennemgaaet af en advokat inden endelig brug.
const CONTACT = "hej@alius.dk";

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="mt-[0.7em] h-1 w-1 shrink-0 rounded-full bg-moss" />
      <span>{children}</span>
    </li>
  );
}

export default function TermsPage() {
  return (
    <LegalLayout
      title="Handelsbetingelser"
      updated="12. juli 2026"
      intro="Disse betingelser gælder, når din butik bruger Stemplet, et digitalt stempelkort fra Alius. De accepteres, når du opretter en butik."
    >
      <LegalSection title="1. Om aftalen">
        <p>
          Stemplet leveres af Alius. Aftalen indgås mellem Alius og den butik
          (virksomhed), der opretter en konto. Tjenesten er beregnet til
          erhvervsbrug.
        </p>
      </LegalSection>

      <LegalSection title="2. Oprettelse og konto">
        <p>
          Du opretter en konto med din e-mail. Du er ansvarlig for at holde
          adgangen til din e-mail og din personale-PIN fortrolig, da de giver
          adgang til at stemple og indløse.
        </p>
      </LegalSection>

      <LegalSection title="3. Priser og betaling">
        <ul className="flex flex-col gap-2.5">
          <Li>
            Stemplet er gratis op til 100 kortholdere med alle funktioner og dit
            eget brand.
          </Li>
          <Li>
            Derover koster Pro 99 kr. om måneden ekskl. moms. De til enhver tid
            gældende priser fremgår på sitet.
          </Li>
          <Li>
            Der er ingen binding. Du kan opsige når som helst og betaler kun for
            den periode, du er i gang.
          </Li>
          <Li>
            Betaling sker mod faktura, der sendes månedsvis forud.
          </Li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Brug af tjenesten">
        <p>
          Du må bruge Stemplet til at drive din butiks stempelkort. Du må ikke
          misbruge tjenesten, forsøge at omgå sikkerheden eller bruge den til
          ulovlige formål.
        </p>
      </LegalSection>

      <LegalSection title="5. Butikkens ansvar for kundedata">
        <p>
          Din butik er dataansvarlig for de kundeoplysninger, der behandles i
          Stemplet. Vi er databehandler og behandler dem efter din instruks. Se{" "}
          <Link href="/databehandleraftale" className="text-moss underline underline-offset-2">
            databehandleraftalen
          </Link>{" "}
          og{" "}
          <Link href="/privatliv" className="text-moss underline underline-offset-2">
            privatlivspolitikken
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="6. Drift og tilgængelighed">
        <p>
          Vi tilstræber en stabil og sikker tjeneste, men kan ikke garantere
          uafbrudt drift. Der kan forekomme planlagt vedligeholdelse og sjældne
          nedbrud.
        </p>
      </LegalSection>

      <LegalSection title="7. Ansvarsbegrænsning">
        <p>
          Stemplet leveres, som den er og forefindes. Alius er ikke ansvarlig
          for indirekte tab, herunder tabt omsætning eller mistede stempler ved
          nedbrud. Et eventuelt ansvar er begrænset til det beløb, du har betalt
          for tjenesten de seneste tre måneder.
        </p>
      </LegalSection>

      <LegalSection title="8. Opsigelse">
        <p>
          Både du og Alius kan opsige aftalen når som helst. Når du lukker din
          konto, slettes kundeoplysningerne inden for rimelig tid, medmindre
          lovgivning kræver fortsat opbevaring.
        </p>
      </LegalSection>

      <LegalSection title="9. Ændringer">
        <p>
          Vi kan ændre betingelser og priser med et rimeligt varsel. Fortsat
          brug efter en ændring betyder, at du accepterer de nye betingelser.
        </p>
      </LegalSection>

      <LegalSection title="10. Lovvalg og værneting">
        <p>
          Aftalen er underlagt dansk ret, og eventuelle tvister afgøres ved de
          danske domstole.
        </p>
      </LegalSection>

      <LegalSection title="11. Kontakt">
        <p>
          Spørgsmål til betingelserne kan rettes til{" "}
          <a href={`mailto:${CONTACT}`} className="text-moss underline underline-offset-2">
            {CONTACT}
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
