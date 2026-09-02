"use client";

import { useEffect, useState } from "react";
import { btnClass } from "@/components/ui";
import { InstallHomeScreen } from "./InstallHomeScreen";

export function PairDevice({
  presetCode,
  error,
}: {
  presetCode: string;
  error?: string | null;
}) {
  const [code, setCode] = useState(presetCode.toUpperCase().slice(0, 6));
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Koerer vi allerede som hjemmeskaerm-app? Saa er DETTE det rigtige sted at
  // parre (appen har sit eget cookie-lager), og "foej til hjemmeskaerm"-tippet
  // skal IKKE vises. I Safari viser vi tippet, saa man goer det i rigtig orden.
  const [standalone, setStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    const sa =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(!!sa);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-12">
      {/* RIGTIG form-POST (top-niveau-navigation) til /kasse/par, saa kasse-
          cookien gemmes paalideligt paa iOS. Ingen server-action-fetch her. */}
      <form
        method="POST"
        action="/kasse/par"
        onSubmit={() => setSubmitting(true)}
        className="flex w-full max-w-sm flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ink/5 text-ink">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <rect x="5" y="2" width="14" height="20" rx="2.5" />
              <path d="M11 18h2" />
            </svg>
          </span>
          <h1 className="font-[300] text-[1.5rem] leading-tight text-ink">
            Par denne enhed
          </h1>
          <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
            Indtast parringskoden fra dashboardet (under Stempel), så bliver den
            her enhed en fast kasse. Ingen login nødvendig bagefter.
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Parringskode
          </span>
          <input
            name="code"
            value={code}
            onChange={(e) =>
              setCode(
                e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6),
              )
            }
            placeholder="ABC123"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
            className="border border-clay bg-white px-4 py-3 text-center font-[400] text-[1.4rem] tracking-[0.4em] text-ink outline-none focus:border-terracotta"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Navn på enheden (valgfrit)
          </span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="iPad ved disken"
            className="border border-clay bg-white px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
          />
        </label>

        {error ? (
          <p className="text-center text-[0.82rem] font-[300] text-rust">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || code.length < 6}
          className={`${btnClass("primary", "lg")} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {submitting ? "Parrer..." : "Par enhed"}
        </button>

        {/* Kun i browseren (ikke naar vi allerede koerer som hjemmeskaerm-app):
            vejled til den rigtige raekkefoelge, saa parringen ikke gaar tabt.
            En hjemmeskaerm-app har sit eget lager, saa parringen skal ske DER. */}
        {standalone === false ? (
          <div className="flex flex-col gap-2 rounded-lg border border-fog bg-white/70 p-4 text-left">
            <p className="text-[0.8rem] font-[500] text-ink">
              Fast enhed? Gør kassen til et app-ikon
            </p>
            <ol className="flex flex-col gap-1 text-[0.78rem] font-[300] leading-relaxed text-stone">
              <li>1. Føj til hjemmeskærm (herunder).</li>
              <li>2. Åbn kassen fra det nye ikon.</li>
              <li>
                3. Indtast koden dér. Så husker kassen sig selv og beder ikke om
                den igen.
              </li>
            </ol>
            <div className="pt-0.5">
              <InstallHomeScreen />
            </div>
            <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
              Koden virker i ca. 30 minutter, så du kan nå at åbne appen og
              indtaste den. Behold den fremme, til kassen er klar.
            </p>
          </div>
        ) : null}
      </form>
    </main>
  );
}
