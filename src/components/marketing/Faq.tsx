"use client";

import { useState } from "react";
import { Section, Eyebrow } from "@/components/ui";

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
  const [open, setOpen] = useState<number | null>(0);

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

        <div className="border-t border-fog">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q} className="border-b border-fog">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left"
                >
                  <span className="font-[300] text-[1rem] leading-[1.4] text-ink">
                    {f.q}
                  </span>
                  <span className="relative h-3.5 w-3.5 shrink-0">
                    <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate" />
                    <span
                      className={`absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate transition-transform duration-300 ${
                        isOpen ? "scale-y-0" : "scale-y-100"
                      }`}
                    />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    isOpen
                      ? "grid-rows-[1fr] opacity-100"
                      : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pr-6 font-[200] text-[0.9rem] leading-[1.8] text-stone">
                      {f.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
