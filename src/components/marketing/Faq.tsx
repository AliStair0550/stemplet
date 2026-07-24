"use client";

import { Section, Eyebrow } from "@/components/ui";
import { FaqAccordion } from "./FaqAccordion";

const FAQS = [
  {
    q: "Skal mine kunder hente en app?",
    a: "Nej. Kortet ligger direkte i Apple Wallet, som allerede findes på alle iPhones. Kunden scanner en QR-kode, trykker Tilføj, og kortet er der.",
  },
  {
    q: "Kan en kunde få flere stempler på én gang, fx tre kaffe, tre stempler?",
    a: "Ja. Personalet scanner kundens kort ved kassen og vælger antallet i scanningsøjeblikket. Tre kaffe, tre stempler, uden ventetid.",
  },
  {
    q: "Virker det på Android?",
    a: "Ja. Android-brugere får et webkort, der åbner i browseren og fungerer på samme måde. Det kan gemmes på hjemmeskærmen som en genvej.",
  },
  {
    q: "Hvad sker der, hvis kunden skifter telefon?",
    a: "Har kunden kortet i Apple Wallet, følger det med til den nye telefon. Ellers kan personalet overføre stemplerne ved kassen.",
  },
  {
    q: "Er der binding?",
    a: "Nej. Du kan opsige når som helst og betaler kun for den måned, du er i gang. Der er intet kreditkort for at starte.",
  },
  {
    q: "Hvordan er det med GDPR?",
    a: "Kundedata ligger i EU, og dine kunder kan være helt anonyme, et stempelkort kræver kun et kort, ikke en identitet. Der ligger både en privatlivspolitik og en databehandleraftale klar til dig.",
  },
];

export default function Faq() {
  return (
    <Section className="bg-terracotta/[0.05]">
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div>
          <Eyebrow>Spørgsmål</Eyebrow>
          <h2 className="mt-4 font-bold text-[2rem] leading-[1.12] tracking-[-0.035em] md:text-[2.5rem] text-ink">
            Det du gerne vil vide.
          </h2>
          <p className="mt-5 max-w-xs font-[200] text-[0.95rem] leading-[1.8] text-stone">
            Kan du ikke finde svaret her, så skriv til os, inden du beslutter
            dig.
          </p>
        </div>

        <FaqAccordion items={FAQS} />
      </div>
    </Section>
  );
}
