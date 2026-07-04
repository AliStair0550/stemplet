"use client";

import { useState } from "react";
import { Section, Eyebrow } from "@/components/ui";

const FAQS = [
  {
    q: "Skal mine kunder hente en app?",
    a: "Nej. Kortet ligger direkte i Apple Wallet, som allerede findes på alle iPhones. Kunden scanner en QR-kode, trykker Tilføj, og kortet er der.",
  },
  {
    q: "Virker det på Android?",
    a: "Ja. Android-brugere får et webkort, der åbner i browseren og fungerer på samme måde. Det kan gemmes på hjemmeskærmen som en genvej.",
  },
  {
    q: "Hvad sker der, hvis kunden skifter telefon?",
    a: "Kortet følger med. Så længe kunden tilføjer det igen fra samme link eller QR-kode, er alle stempler bevaret.",
  },
  {
    q: "Er der binding?",
    a: "Nej. Du kan opsige når som helst og betaler kun for den måned, du er i gang. Der er intet kreditkort for at starte.",
  },
  {
    q: "Hvordan er det med GDPR?",
    a: "Alle data ligger i EU. Du behøver ikke at indsamle navn eller e-mail, så dine kunder kan være helt anonyme. Et stempelkort kræver kun et kort, ikke en identitet.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section>
      <div className="grid gap-12 md:grid-cols-[0.85fr_1.15fr] md:gap-16">
        <div>
          <Eyebrow>Spørgsmål</Eyebrow>
          <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
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
