"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  MATERIAL_HEADLINE_MAX,
  DEFAULT_MATERIAL_HEADLINE,
} from "@/lib/materials";

const MATERIALS = [
  { type: "a5", title: "A5-skilt", body: "Mellemstort skilt til disk eller væg." },
  { type: "skilt", title: "A6-diskskilt", body: "Lille skilt til at stå ved kassen." },
] as const;

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-label font-[400] uppercase tracking-[0.12em] text-slate">
      {children}
    </span>
  );
}

export function MaterialsPrint() {
  const [titel, setTitel] = useState(DEFAULT_MATERIAL_HEADLINE);
  const [light, setLight] = useState(false);
  const [withBrand, setWithBrand] = useState(false);
  const [withStamps, setWithStamps] = useState(true);
  // Tilpasning er valgfri og foldet ind som standard, saa man foerst og fremmest
  // ser de to stoerrelser, man kan hente.
  const [showOptions, setShowOptions] = useState(false);

  const trimmedTitel = titel.trim();

  // Byg query kun med det der afviger fra standard, saa URL'en er ren.
  const qs = new URLSearchParams();
  if (trimmedTitel && trimmedTitel !== DEFAULT_MATERIAL_HEADLINE)
    qs.set("titel", trimmedTitel);
  if (light) qs.set("bg", "lys");
  if (withBrand) qs.set("navn", "1");
  if (!withStamps) qs.set("stempler", "0");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  // Kort opsummering af de valgte indstillinger, saa man kan se dem uden at
  // folde ud.
  const optionSummary = `${light ? "Lys" : "Farvet"} baggrund${
    withStamps ? ", med stempler" : ""
  }${withBrand ? ", navn og logo" : ""}`;

  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl font-[300] text-[0.9rem] leading-relaxed text-stone">
        Skilte med et tomt stempelkort i dit design, til disk og væg. Vælg en
        størrelse og hent den. Vil du ændre udseendet, kan du tilpasse skiltet
        først.
      </p>

      {/* Den primaere handling: vaelg stoerrelse og hent. */}
      <div className="grid gap-3 sm:grid-cols-2">
        {MATERIALS.map((m) => (
          <div
            key={m.type}
            className="flex items-center gap-4 rounded-lg border border-fog bg-white p-5 shadow-card"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
              <IconDoc />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-[400] text-[0.98rem] text-ink">{m.title}</h3>
              <p className="mt-0.5 font-[300] text-[0.82rem] leading-relaxed text-stone">
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

      {/* Tilpasning: valgfri, foldet ind. */}
      <div>
        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          aria-expanded={showOptions}
          className="inline-flex items-center gap-2 text-[0.82rem] font-[400] text-ink transition-colors hover:text-terracotta"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              "h-4 w-4 text-terracotta transition-transform",
              showOptions ? "rotate-90" : "",
            )}
            aria-hidden
          >
            <path d="M9 6l6 6-6 6" />
          </svg>
          Tilpas skiltet
          <span className="font-[300] text-[0.78rem] text-slate">
            ({optionSummary})
          </span>
        </button>

        {showOptions ? (
          <div className="mt-4 flex flex-col gap-5 rounded-lg border border-fog bg-sand/30 p-6">
            <label className="flex flex-col gap-1.5">
              <FieldLabel>Overskrift</FieldLabel>
              <div className="relative w-full max-w-sm">
                <input
                  type="text"
                  value={titel}
                  maxLength={MATERIAL_HEADLINE_MAX}
                  onChange={(e) => setTitel(e.target.value)}
                  placeholder={DEFAULT_MATERIAL_HEADLINE}
                  className="w-full rounded-md border border-clay bg-parchment px-3 py-2.5 pr-14 font-[300] text-[0.9rem] text-ink outline-none focus:border-terracotta"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[0.72rem] font-[300] tabular-nums text-slate">
                  {titel.length}/{MATERIAL_HEADLINE_MAX}
                </span>
              </div>
            </label>

            <div className="flex flex-col gap-1.5">
              <FieldLabel>Baggrund</FieldLabel>
              <div className="inline-flex w-fit rounded-full border border-clay bg-parchment p-0.5">
                {[
                  { on: false, label: "Farvet" },
                  { on: true, label: "Lys" },
                ].map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    onClick={() => setLight(o.on)}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[0.82rem] transition-colors",
                      light === o.on
                        ? "bg-terracotta text-parchment"
                        : "text-stone hover:text-ink",
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <span className="text-[0.76rem] font-[300] text-slate">
                {light
                  ? "Lys baggrund sparer blæk og passer til enhver printer."
                  : "Farvet baggrund matcher dit stempelkort."}
              </span>
            </div>

            <div className="flex flex-col gap-3 border-t border-fog pt-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={withStamps}
                  onChange={(e) => setWithStamps(e.target.checked)}
                  className="h-4 w-4 shrink-0 accent-terracotta"
                />
                <span className="text-[0.9rem] font-[400] text-ink">
                  Vis stempler på skiltet
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={withBrand}
                  onChange={(e) => setWithBrand(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta"
                />
                <span className="text-[0.9rem] font-[400] text-ink">
                  Tilføj butikkens navn og logo
                  <span className="mt-0.5 block text-[0.78rem] font-[300] leading-relaxed text-stone">
                    Fra som standard, så navnet kan stå i jeres egen skrift. Slå
                    til, hvis I vil have det med.
                  </span>
                </span>
              </label>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
