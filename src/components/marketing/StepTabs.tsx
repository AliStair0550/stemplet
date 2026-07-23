"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Statisk, rolle-opdelt "saadan virker det": fire trin for hver rolle. Et roligt,
// kort-baseret alternativ til den animerede demo, saa vi kan vurdere hvad der
// virker bedst paa forsiden.

type Role = "kunde" | "medarbejder" | "ejer";

const ROLES: { key: Role; label: string }[] = [
  { key: "kunde", label: "Kunde" },
  { key: "medarbejder", label: "Medarbejder" },
  { key: "ejer", label: "Ejer" },
];

const STEPS: Record<Role, { title: string; body: string }[]> = {
  kunde: [
    { title: "Scan butikkens QR", body: "Med kameraet. Ingen app skal hentes." },
    {
      title: 'Tryk "Hent mit stempelkort"',
      body: "Ét tryk. Ingen tilmelding, ingen formularer.",
    },
    {
      title: "Tilføj til Apple Wallet",
      body: "Tryk Tilføj, og kortet ligger i din Apple Wallet.",
    },
    {
      title: "Vis kortet, se stemplerne vokse",
      body: "Det er alt.",
    },
  ],
  medarbejder: [
    {
      title: "Scan med jeres telefon",
      body: "Scanneren er indbygget i appen. Intet ekstra udstyr.",
    },
    {
      title: "Scan kundens kort",
      body: "Scan stempelkortet direkte fra kundens Wallet.",
    },
    {
      title: "Automatisk stempel",
      body: "Signeret engangsstempel. Kan ikke kopieres.",
    },
    {
      title: "Indløs med PIN",
      body: "Ved fuldt kort frigiver jeres PIN belønningen.",
    },
  ],
  ejer: [
    {
      title: "Opret dit kort",
      body: "Tilpas kortet til jeres brand. Klar på fem minutter.",
    },
    {
      title: "Print QR-koden",
      body: "Sæt den ved kassen. Det er hele opsætningen.",
    },
    {
      title: "Følg statistikken",
      body: "Genbesøg, stempler og indløsninger, live.",
    },
    {
      title: "Beløn dine stamkunder",
      body: "Flere fordele til dem, der kommer igen (og igen).",
    },
  ],
};

export function StepTabs() {
  const [role, setRole] = useState<Role>("kunde");
  const steps = STEPS[role];

  return (
    <>
      {/* Rolle-faner (venstrestillet, som resten af sektionen) */}
      <div className="mt-16 flex flex-wrap justify-start gap-2">
        {ROLES.map((r) => {
          const active = role === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              aria-pressed={active}
              className={cn(
                "rounded-full px-5 py-2.5 text-[0.9rem] font-medium transition-colors",
                active
                  ? "bg-ink text-parchment ring-1 ring-terracotta"
                  : "bg-sand text-taupe hover:text-ink",
              )}
            >
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Fire trin */}
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="flex flex-col items-center gap-4 rounded-[20px] border border-ink/[0.08] bg-white p-6 text-center shadow-card"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/10 text-[0.85rem] font-bold text-terracotta">
              {i + 1}
            </span>
            <h3 className="text-[1.05rem] font-bold leading-[1.25] tracking-[-0.01em] text-ink">
              {s.title}
            </h3>
            <p className="text-[0.9rem] leading-[1.6] text-taupe">{s.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
