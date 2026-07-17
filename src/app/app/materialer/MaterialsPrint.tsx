"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { MATERIAL_HEADLINES } from "@/lib/materials";

const MATERIALS = [
  { type: "plakat", title: "A4-plakat", body: "Til opslagstavlen eller vinduet." },
  { type: "a5", title: "A5-skilt", body: "Mellemstort skilt til disken eller væggen." },
  { type: "skilt", title: "A6-diskskilt", body: "Lille skilt til at stå ved kassen." },
  { type: "visitkort", title: "Visitkort", body: "Til hånden eller ved betalingen. 85 x 55 mm." },
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
  const [titel, setTitel] = useState(0);
  const [light, setLight] = useState(false);
  const [withBrand, setWithBrand] = useState(false);
  const [withStamps, setWithStamps] = useState(true);

  // Byg query kun med det der afviger fra standard, saa URL'en er ren.
  const qs = new URLSearchParams();
  if (titel > 0) qs.set("titel", String(titel));
  if (light) qs.set("bg", "lys");
  if (withBrand) qs.set("navn", "1");
  if (!withStamps) qs.set("stempler", "0");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
        Færdige skilte, klar til print
      </h2>

      {/* Valg: tilpas skiltet, saa det passer jer, og print med det samme */}
      <div className="flex flex-col gap-5 rounded-lg border border-fog bg-white p-6 shadow-card">
        {/* Overskrift */}
        <label className="flex flex-col gap-1.5">
          <span className="text-label font-[400] uppercase tracking-[0.12em] text-slate">
            Overskrift
          </span>
          <select
            value={titel}
            onChange={(e) => setTitel(Number(e.target.value))}
            className="w-full max-w-sm rounded-md border border-clay bg-parchment px-3 py-2.5 font-[300] text-[0.9rem] text-ink outline-none focus:border-terracotta"
          >
            {MATERIAL_HEADLINES.map((h, i) => (
              <option key={h} value={i}>
                {h}
              </option>
            ))}
          </select>
        </label>

        {/* Baggrund */}
        <div className="flex flex-col gap-1.5">
          <span className="text-label font-[400] uppercase tracking-[0.12em] text-slate">
            Baggrund
          </span>
          <div className="inline-flex w-fit rounded-full border border-clay p-0.5">
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

        {/* Til/fra-valg */}
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
                Fra som standard, så navnet kan stå i jeres egen skrift. Slå til,
                hvis I vil have det med.
              </span>
            </span>
          </label>
        </div>
      </div>

      {/* Formater: hent PDF med de valgte indstillinger */}
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
