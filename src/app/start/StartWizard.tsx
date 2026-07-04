"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { CardDesigner, DEFAULT_DESIGN, type CardDesign } from "@/components/CardDesigner";
import { btnClass } from "@/components/ui";
import { createBusinessAction, sendOnboardingLogin, type CreateResult } from "./actions";

const STEPS = ["Din butik", "Design kortet", "Print og gå i gang"];

export function StartWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
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
      const res = await createBusinessAction({ name, email, pin, design });
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
              placeholder="Demo Kaffebar"
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
              Personale-PIN (til indløsning)
            </span>
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="4 til 6 cifre"
              className="w-40 border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] tracking-[0.3em] text-ink outline-none focus:border-moss"
            />
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
            allowLogo={false}
            showPoweredBy
          />
          <p className="text-[0.75rem] font-[200] text-slate">
            Du kan tilføje dit logo og ændre alt bagefter i dashboardet.
          </p>
        </div>
      ) : null}

      {step === 2 && created ? (
        <div className="flex flex-col items-center gap-6 text-center">
          <h2 className="font-fraunces font-light italic text-[1.8rem] text-ink">
            Din butik er klar
          </h2>
          <p className="max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
            Print denne QR-kode og sæt den ved kassen. Dine kunder scanner den
            og har deres stempelkort på fem sekunder.
          </p>
          <div className="rounded-sm border border-fog bg-white p-5">
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
            href={created.cardUrl}
            className="text-[0.8rem] font-[200] text-moss hover:opacity-70"
          >
            {created.cardUrl}
          </a>
          <form action={sendOnboardingLogin}>
            <input type="hidden" name="email" value={email} />
            <button className={btnClass("primary", "lg")}>
              Log ind på dashboardet
            </button>
          </form>
        </div>
      ) : null}

      {error ? (
        <p className="text-[0.82rem] font-[200] text-moss">{error}</p>
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
              disabled={pending}
              className={btnClass("moss")}
            >
              {pending ? "Opretter..." : "Opret min butik"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
