"use client";

import { useRef, useState } from "react";
import { Spinner } from "@/components/SubmitButton";
import { rgba } from "@/lib/brand";

// Hente-sidens formularer: navn og e-mail til et nyt kort, og gendan et kort.

// Fejl-koder (fra claim-ruten via ?fejl=) oversat til en klar besked.
export const ERRORS: Record<string, string> = {
  lukket: "Kortet er ikke aktivt lige nu. Spørg personalet i butikken.",
  fuld: "Butikken kan ikke tage imod flere kort lige nu. Spørg personalet.",
  pause: "Butikken tager ikke imod nye kort lige nu. Spørg personalet.",
  stoppet: "Kortet er sat på pause lige nu. Spørg personalet i butikken.",
  // Forbigaaende serverfejl (fx en kortvarig database-blip): kunden kan bare
  // proeve igen om et oejeblik, saa vi viser en "Proev igen"-knap.
  serverfejl: "Der opstod en kortvarig fejl. Prøv igen om et øjeblik.",
  // For mange henvendelser fra samme netvaerk lige nu (fx travl cafe-WiFi).
  optaget: "Der er lidt travlt lige nu. Prøv igen om et øjeblik.",
};

// Indtastningsfelter: naesten taet flade i kortets tekstfarve (ctaBg) med tekst
// i kortfarven (ctaFg), saa de staar tydeligt frem paa baggrunden.
function fieldStyle(ctaBg: string, ctaFg: string): React.CSSProperties {
  return { color: ctaFg, background: rgba(ctaBg, 0.94), border: `1px solid ${rgba(ctaBg, 0.5)}` };
}

// Kontaktformularen (trin 1 for nye kunder): navn og e-mail er paakraevet, og
// lov til at kontakte kunden paa mail (fx med tilbud) er et frivilligt,
// ikke-afkrydset flueben. Indsendes med
// fetch til ./kontakt, som opretter kortet og saetter cookies. Wallet aabnes
// FOERST bagefter fra det rigtige link (trin 2), saa aabningen forbliver
// paalidelig.
export function ContactForm({
  slug,
  shopName,
  cta,
  ctaBg,
  ctaFg,
  onReady,
  onFejl,
  onEmailTaken,
  referral,
}: {
  slug: string;
  shopName: string;
  /** Butikken har henvisninger: tilmeld via henvisningerne (kode + vennens rabat). */
  referral: { code: string | null; source: "LINK" | "CODE_ENTERED" } | null;
  /** "Hent dit Sara Salon-kort" */
  cta: string;
  ctaBg: string;
  ctaFg: string;
  onReady: () => void;
  onFejl: (code: string) => void;
  /** E-mailen har allerede et kort i butikken: tilbyd at gendanne det. */
  onEmailTaken: (email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Laas, der virker med det samme (state naar foerst ud ved naeste render), saa
  // et hurtigt dobbelttryk ikke sender formularen to gange.
  const sending = useRef(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending.current) return;
    sending.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = referral
        ? await fetch(`/api/henvisninger/${encodeURIComponent(slug)}/tilmeld`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, consent, code: referral.code, source: referral.source }),
          })
        : await fetch(`/api/wallet/claim/${encodeURIComponent(slug)}/kontakt`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ name, email, consent }),
          });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; code?: string; message?: string }
        | null;
      if (data?.ok) {
        onReady();
        return;
      }
      if (data?.code === "mail_findes") {
        onEmailTaken(email);
        return;
      }
      if (data?.message) setError(data.message);
      else onFejl(data?.code && Object.hasOwn(ERRORS, data.code) ? data.code : "serverfejl");
    } catch {
      onFejl("serverfejl");
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  const inputStyle = fieldStyle(ctaBg, ctaFg);
  const inputCls =
    "w-full rounded-xl px-4 py-3 text-[1rem] font-[400] outline-none placeholder:opacity-50 focus:ring-2";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.78rem] font-[500]" style={{ color: rgba(ctaBg, 0.85) }}>
          Navn
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={40}
          required
          placeholder="Dit navn"
          className={inputCls}
          style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.78rem] font-[500]" style={{ color: rgba(ctaBg, 0.85) }}>
          E-mail
        </span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          required
          placeholder="navn@mail.dk"
          className={inputCls}
          style={inputStyle}
        />
      </label>
      <label className="flex cursor-pointer items-start gap-3 py-1 text-left">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ accentColor: ctaBg }}
        />
        <span className="text-[0.84rem] font-[300] leading-snug" style={{ color: rgba(ctaBg, 0.85) }}>
          Ja, {shopName} må kontakte mig på mail, fx med tilbud. Du kan altid
          framelde dig igen.
        </span>
      </label>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
        >
          {error}
        </p>
      ) : null}
      <div className="relative mt-1 w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl blur-md animate-cta-glow"
          style={{ background: rgba(ctaBg, 0.3) }}
        />
        <button
          type="submit"
          disabled={busy}
          className="relative flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium tracking-[-0.01em] shadow-lift transition-transform duration-200 active:scale-[0.98] disabled:cursor-wait"
          style={{ backgroundColor: ctaBg, color: ctaFg }}
        >
          {busy ? <Spinner /> : null}
          {busy ? "Henter dit kort" : cta}
        </button>
      </div>
    </form>
  );
}

// Gendan kortet: kunden skriver sin e-mail og faar et link, der virker een gang.
// Svaret er altid det samme, saa siden ikke afsloerer, hvem der har et kort.
export function RecoverForm({
  slug,
  shopName,
  initialEmail,
  taken,
  ctaBg,
  ctaFg,
  onBack,
}: {
  slug: string;
  shopName: string;
  initialEmail: string;
  /** Kom vi hertil, fordi e-mailen allerede har et kort? */
  taken: boolean;
  ctaBg: string;
  ctaFg: string;
  onBack: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/claim/${encodeURIComponent(slug)}/gendan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as { ok: boolean; message?: string } | null;
      if (data?.ok) setSent(true);
      else setError(data?.message ?? "Der opstod en kortvarig fejl. Prøv igen.");
    } catch {
      setError("Der opstod en kortvarig fejl. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  const muted = { color: rgba(ctaBg, 0.82) };
  if (sent) {
    return (
      <div
        role="status"
        className="flex w-full flex-col items-center gap-2 rounded-xl p-5 text-center"
        style={{ background: rgba(ctaBg, 0.1), border: `1px solid ${rgba(ctaBg, 0.18)}` }}
      >
        <span className="text-[0.98rem] font-[500]">Tjek din mail</span>
        <span className="text-[0.86rem] font-[300] leading-relaxed" style={muted}>
          Har {email} et kort hos {shopName}, har vi sendt et link. Åbn det på denne telefon. Linket virker i 30 minutter.
        </span>
        <button type="button" onClick={onBack} className="mt-1 text-[0.82rem] underline underline-offset-2 opacity-80">
          Tilbage
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3" noValidate>
      <p className="text-center text-[0.9rem] font-[300] leading-relaxed" style={muted}>
        {taken
          ? `Der er allerede et kort med den e-mail hos ${shopName}. Vi sender et link til din mail, så du kan gendanne det på denne telefon.`
          : "Skriv den e-mail, du brugte, da du fik kortet. Så sender vi et link, så du kan gendanne det på denne telefon."}
      </p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={254}
        aria-label="E-mail"
        placeholder="navn@mail.dk"
        className="w-full rounded-xl px-4 py-3 text-[1rem] font-[400] outline-none placeholder:opacity-50 focus:ring-2"
        style={fieldStyle(ctaBg, ctaFg)}
      />
      {error ? (
        <p role="alert" className="rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-center text-[0.85rem] font-[300] text-rust">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium shadow-lift transition-transform active:scale-[0.98] disabled:cursor-wait"
        style={{ backgroundColor: ctaBg, color: ctaFg }}
      >
        {busy ? <Spinner /> : null}
        {busy ? "Et øjeblik" : "Send link"}
      </button>
      <button type="button" onClick={onBack} className="self-center text-[0.84rem] underline underline-offset-2 opacity-80" style={{ color: ctaBg }}>
        Tilbage
      </button>
    </form>
  );
}
