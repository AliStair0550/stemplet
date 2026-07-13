"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CardDesigner, DEFAULT_DESIGN, type CardDesign } from "@/components/CardDesigner";
import { btnClass } from "@/components/ui";
import { createBusinessAction, sendOnboardingLogin, type CreateResult } from "./actions";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

const STEPS = ["Din butik", "Design kortet", "Print og gå i gang"];

export function StartWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [category, setCategory] = useState("");
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Extract<CreateResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();

  function next() {
    setError(null);
    if (step === 0) {
      if (name.trim().length < 2) return setError("Skriv virksomhedens navn.");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Skriv en gyldig e-mail.");
      if (!/^\d{4,6}$/.test(pin)) return setError("PIN skal være 4 til 6 cifre.");
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await createBusinessAction({ name, email, pin, category, design, acceptedTerms });
      if (res.ok) {
        setCreated(res);
        setStep(2);
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      {/* Trin-indikator */}
      <ol className="flex items-center gap-3">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-3">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[0.72rem] ${
                i <= step ? "bg-moss text-parchment" : "bg-fog text-slate"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={`hidden text-[0.72rem] font-[300] uppercase tracking-[0.1em] sm:block ${
                i <= step ? "text-ink" : "text-slate"
              }`}
            >
              {label}
            </span>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <div className="flex flex-col gap-5">
          <h2 className="font-[300] text-[1.5rem] text-ink">Din butik</h2>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Virksomhedens navn
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Coffee Lab"
              className="border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-moss"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              E-mail (til login)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dig@dinvirksomhed.dk"
              className="border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-moss"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Personale-PIN
            </span>
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="4 til 6 cifre"
              className="w-40 border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] tracking-[0.3em] text-ink outline-none focus:border-moss"
            />
            <span className="text-[0.74rem] font-[200] leading-relaxed text-slate">
              Bruges når personalet indløser en fyldt belønning ved kassen. Du
              kan altid ændre den senere.
            </span>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Branche (valgfri)
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-moss"
            >
              <option value="">Vælg branche</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-5">
          <h2 className="font-[300] text-[1.5rem] text-ink">Design kortet</h2>
          <CardDesigner
            value={design}
            onChange={setDesign}
            businessName={name || "Din butik"}
            allowLogo
          />
          <p className="text-[0.75rem] font-[200] text-slate">
            Tilføj dit logo nu, så henter vi automatisk dine farver. Du kan
            ændre alt bagefter i dashboardet.
          </p>
          <label className="flex cursor-pointer items-start gap-3 border-t border-fog pt-5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-moss"
            />
            <span className="text-[0.78rem] font-[200] leading-relaxed text-stone">
              Jeg accepterer{" "}
              <a
                href="/handelsbetingelser"
                target="_blank"
                rel="noreferrer"
                className="text-moss underline underline-offset-2 hover:opacity-70"
              >
                handelsbetingelserne
              </a>
              ,{" "}
              <a
                href="/privatliv"
                target="_blank"
                rel="noreferrer"
                className="text-moss underline underline-offset-2 hover:opacity-70"
              >
                privatlivspolitikken
              </a>{" "}
              og{" "}
              <a
                href="/databehandleraftale"
                target="_blank"
                rel="noreferrer"
                className="text-moss underline underline-offset-2 hover:opacity-70"
              >
                databehandleraftalen
              </a>
              .
            </span>
          </label>
        </div>
      ) : null}

      {step === 2 && created ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-fraunces font-light italic text-[1.8rem] text-ink">
            Din butik er klar
          </h2>
          <p className="max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
            Print denne QR-kode og sæt den ved kassen. Dine kunder scanner den
            og har deres stempelkort på fem sekunder. QR-koden ligger også altid
            klar i dashboardet.
          </p>
          <div className="rounded-lg border border-fog bg-white p-5">
            <Image
              src={created.qrDataUrl}
              alt="QR til dit stempelkort"
              width={220}
              height={220}
              className="h-52 w-52"
              unoptimized
            />
          </div>
          <a
            href={created.qrDataUrl}
            download={`stemplet-qr-${created.slug}.png`}
            className={btnClass("outline")}
          >
            Download QR-kode
          </a>
          <a
            href={created.cardUrl}
            className="text-[0.8rem] font-[200] text-moss hover:opacity-70"
          >
            {created.cardUrl}
          </a>
          <div className="mt-2 flex flex-col items-center gap-2 border-t border-fog pt-6">
            <form action={sendOnboardingLogin}>
              <input type="hidden" name="email" value={email} />
              <button className={btnClass("primary", "lg")}>
                Log ind på dashboardet
              </button>
            </form>
            <p className="max-w-xs text-[0.72rem] font-[200] leading-relaxed text-slate">
              Vi sender et login-link til {email}. Klik det, og du er inde i
              dashboardet. Husk at tjekke spam-mappen, hvis det ikke dukker op.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-[0.82rem] font-[200] text-rust">{error}</p>
      ) : null}

      {/* Navigation */}
      {step < 2 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className={`text-[0.72rem] font-[300] uppercase tracking-[0.12em] text-slate hover:text-ink ${
              step === 0 ? "invisible" : ""
            }`}
          >
            Tilbage
          </button>
          {step === 0 ? (
            <button onClick={next} className={btnClass("primary")}>
              Fortsæt
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={pending || !acceptedTerms}
              className={`${btnClass("moss")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {pending ? "Opretter..." : "Opret min butik"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
