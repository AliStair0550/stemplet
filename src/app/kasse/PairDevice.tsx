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
    <main className="dash-theme flex min-h-screen flex-col items-center justify-center bg-parchment px-6 py-12">
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
            Din kasse
          </h1>
          <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
            {presetCode
              ? "Tryk på knappen, så er kassen klar på denne telefon. Ingen login."
              : "Skriv koden fra butikken, så er kassen klar. Ingen login."}
          </p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Kode
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
            className="rounded-xl border border-clay bg-white px-4 py-3 text-center font-[400] text-[1.4rem] tracking-[0.4em] text-ink outline-none focus:border-terracotta"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Dit navn (valgfrit)
          </span>
          <input
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 40))}
            placeholder="Fx Mia"
            className="rounded-xl border border-clay bg-white px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
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
          {submitting ? "Åbner kassen..." : "Åbn kassen"}
        </button>

        {/* Valgfrit: kassen som app paa hjemmeskaermen. En hjemmeskaerm-app har sit
            eget cookie-lager, saa koden skal skrives INDE i appen for at holde. */}
        {standalone === false ? (
          <details className="rounded-xl border border-fog bg-white p-4 text-left">
            <summary className="cursor-pointer text-[0.86rem] font-[500] text-ink">
              Vil du have kassen som app på hjemmeskærmen?
            </summary>
            <ol className="mt-3 flex flex-col gap-2.5">
              {["Føj kassen til hjemmeskærmen", "Åbn kassen fra det nye ikon", "Skriv koden inde i appen"].map((step, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[0.72rem] font-[600] text-parchment">
                    {i + 1}
                  </span>
                  <span className="text-[0.84rem] font-[300] leading-snug text-stone">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 flex items-center gap-3 border-t border-fog pt-3">
              <InstallHomeScreen />
              <span className="text-[0.72rem] font-[300] leading-snug text-slate">
                Koden virker i 30 minutter, så der er tid til at åbne appen.
              </span>
            </div>
          </details>
        ) : null}
      </form>
    </main>
  );
}
