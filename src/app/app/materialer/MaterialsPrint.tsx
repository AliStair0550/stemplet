"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";

const MATERIALS = [
  {
    type: "plakat",
    title: "A4-plakat",
    body: "Til opslagstavlen eller vinduet.",
  },
  {
    type: "a5",
    title: "A5-skilt",
    body: "Mellemstort skilt til disken eller væggen.",
  },
  {
    type: "skilt",
    title: "A6-diskskilt",
    body: "Lille skilt til at stå ved kassen.",
  },
  {
    type: "visitkort",
    title: "Visitkort",
    body: "Til hånden eller ved betalingen. 85 x 55 mm.",
  },
] as const;

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export function MaterialsPrint() {
  // Standard: uden navn/logo. Butikker skriver ofte navnet med egen font eller
  // har et specielt logo, saa skiltet er rent brandet paa farver + stempler.
  const [withBrand, setWithBrand] = useState(false);
  const suffix = withBrand ? "?navn=1" : "";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
          Færdige skilte, klar til print
        </h2>
      </div>

      {/* Styring: navn/logo fra som standard, kan slaas til */}
      <div className="flex flex-col gap-2 rounded-lg border border-fog bg-white p-5 shadow-card">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={withBrand}
            onChange={(e) => setWithBrand(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-terracotta"
          />
          <span className="text-[0.9rem] font-[400] text-ink">
            Tilføj butikkens navn og logo på skiltet
          </span>
        </label>
        <p className="pl-7 text-[0.8rem] font-[300] leading-relaxed text-stone">
          Som standard er skiltene rene, uden navn og logo, så de passer til jeres
          eget skilt eller opslag, og navnet kan stå i jeres egen skrift. Slå til,
          hvis I vil have det med.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MATERIALS.map((m) => (
          <div
            key={m.type}
            className="flex items-center gap-5 rounded-lg border border-fog bg-white p-6 shadow-card"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
              <IconDoc />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-[400] text-[1rem] text-ink">{m.title}</h3>
              <p className="mt-0.5 font-[300] text-[0.84rem] leading-relaxed text-stone">
                {m.body}
              </p>
            </div>
            <a
              href={`/api/materials/${m.type}${suffix}`}
              target="_blank"
              rel="noopener"
              className={btnClass("outline")}
            >
              Hent PDF
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
