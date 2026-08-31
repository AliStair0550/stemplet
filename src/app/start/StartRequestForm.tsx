"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";

const inputCls =
  "w-full border border-clay bg-white px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none transition-colors focus:border-terracotta";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[0.7rem] font-[500] uppercase tracking-[0.1em] text-slate">
      {children}
    </span>
  );
}

export function StartRequestForm() {
  const [businessName, setBusinessName] = useState("");
  const [reward, setReward] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!businessName.trim() || !reward.trim() || !email.trim()) {
      setError("Udfyld virksomhed, ønsket belønning og e-mail.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/start-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ businessName, reward, contactName, email, phone }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setDone(true);
      } else {
        setError(data?.message ?? "Noget gik galt. Prøv igen om lidt.");
      }
    } catch {
      setError("Kunne ikke sende lige nu. Tjek forbindelsen og prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <h1 className="mt-6 font-fraunces text-[1.9rem] font-light italic leading-tight text-ink">
          Tak, vi har modtaget det
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-[300] text-[0.95rem] leading-relaxed text-stone">
          Vi laver et udkast til dit stempelkort og vender tilbage på {email.trim()}.
          Har du spørgsmål i mellemtiden, så skriv til hej@alius.dk.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="text-center">
        <h1 className="font-fraunces text-[2rem] font-light leading-tight text-ink">
          Kom gratis i gang
        </h1>
        <p className="mx-auto mt-3 max-w-sm font-[300] text-[0.95rem] leading-relaxed text-stone">
          Fortæl kort om din butik, så laver vi et udkast til dit stempelkort og
          tager fat i dig. Ingen konto eller kreditkort, bare en hurtig snak.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <Label>Virksomhed</Label>
          <input
            className={inputCls}
            value={businessName}
            maxLength={120}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Fx: Philly & Burgers"
            autoComplete="organization"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <Label>Ønsket belønning</Label>
          <textarea
            className={`${inputCls} min-h-[5.5rem] resize-y`}
            value={reward}
            maxLength={300}
            onChange={(e) => setReward(e.target.value)}
            placeholder="Fx: Saml 10 stempler og få den 10. kaffe gratis"
          />
        </label>

        <div className="border-t border-fog pt-4">
          <Label>Kontaktoplysninger</Label>
          <div className="mt-2 flex flex-col gap-3">
            <input
              className={inputCls}
              value={contactName}
              maxLength={80}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Dit navn (valgfrit)"
              autoComplete="name"
            />
            <input
              className={inputCls}
              type="email"
              value={email}
              maxLength={120}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@mail.dk"
              autoComplete="email"
            />
            <input
              className={inputCls}
              type="tel"
              value={phone}
              maxLength={40}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Telefon (valgfrit)"
              autoComplete="tel"
            />
          </div>
        </div>

        {error ? (
          <p className="text-[0.85rem] font-[300] text-rust">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className={`${btnClass("primary", "lg")} mt-1 w-full disabled:opacity-60`}
        >
          {busy ? "Sender..." : "Send anmodning"}
        </button>
        <p className="text-center text-[0.75rem] font-[300] leading-relaxed text-slate">
          Vi bruger kun dine oplysninger til at kontakte dig om dit stempelkort.
        </p>
      </form>
    </div>
  );
}
