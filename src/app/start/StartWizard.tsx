"use client";

import { useState, useTransition } from "react";
import { CardDesigner, DEFAULT_DESIGN, type CardDesign } from "@/components/CardDesigner";
import { btnClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { createBusinessAction, sendOnboardingLogin, type CreateResult } from "./actions";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

const STEPS = ["Din butik", "Design kortet", "Print og gå i gang"];

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-moss"
      aria-hidden
    >
      <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

export function StartWizard() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Extract<CreateResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.cardUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* udklipsholder ikke tilgaengelig */
    }
  }

  async function shareCard() {
    if (!created) return;
    const data = {
      title: `${name || "Stempelkort"} i din Wallet`,
      text: "Saml stempler og få en belønning. Ingen app, det ligger i din Wallet.",
      url: created.cardUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch {
      // Brugeren afbroed delingen (eller den fejlede). Goer intet: "Kopiér link"
      // staar lige ved siden af som fallback.
      return;
    }
    copyLink();
  }

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
      const res = await createBusinessAction({ name, email, pin, category, address, design, acceptedTerms });
      if (res.ok) {
        setCreated(res);
        setStep(2);
      } else {
        setError(res.error);
        // Adressefeltet ligger paa trin 0: hop tilbage, saa fejlen giver mening.
        if (res.field === "address") setStep(0);
      }
    });
  }

  return (
    <div
      className={`mx-auto flex w-full flex-col gap-8 ${
        step === 2 ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
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
        <div className="flex flex-col gap-5 animate-step">
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
              autoComplete="email"
              inputMode="email"
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

          {/* Valgfri: placering til laaseskaerm allerede fra start */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-fog bg-sand/40 p-4">
            <div className="flex items-center gap-2">
              <PinIcon />
              <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                Placering til låseskærm (valgfri)
              </span>
            </div>
            <p className="font-[200] text-[0.8rem] leading-relaxed text-stone">
              Skriv butikkens adresse, så dukker kundens stempelkort op på deres
              låseskærm, når de er i nærheden. En gratis påmindelse, helt uden
              app. Så kører det, indtil du selv slår det fra.
            </p>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Fx Nørregade 12, 8000 Aarhus"
              autoComplete="street-address"
              className="mt-1 border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-moss"
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="flex flex-col gap-5 animate-step">
          <h2 className="font-[300] text-[1.5rem] text-ink">Design kortet</h2>
          <CardDesigner
            value={design}
            onChange={setDesign}
            businessName={name}
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
        <div className="flex flex-col gap-8 animate-step">
          <div className="text-center">
            <h2 className="font-fraunces font-light italic text-[1.9rem] text-ink">
              Du er klar
            </h2>
            <p className="mx-auto mt-3 max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
              Gør to ting nu: sæt kortet op i butikken, og del det online. Så
              begynder dine kunder at samle stempler direkte i deres Apple
              Wallet.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* 1: Se og del kortet online */}
            <div className="flex flex-col gap-4 rounded-lg border border-fog bg-white shadow-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10 text-[0.8rem] font-[500] text-moss">
                  1
                </span>
                <h3 className="font-[400] text-[1rem] text-ink">
                  Se og del kortet
                </h3>
              </div>
              <p className="font-[200] text-[0.82rem] leading-relaxed text-stone">
                Åbn dit kort og del linket online, så folk lægger det i deres
                Wallet.
              </p>
              <span className="break-all rounded-md bg-sand px-3 py-2 text-center text-[0.74rem] font-[300] text-slate">
                {created.cardUrl}
              </span>
              <div className="mt-auto flex flex-col gap-2">
                <a
                  href={created.cardUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={btnClass("moss")}
                >
                  Se mit kort
                </a>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={shareCard}
                    className={`${btnClass("outline")} flex-1`}
                  >
                    Del
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    className={`${btnClass("outline")} flex-1`}
                  >
                    {copied ? "Kopieret" : "Kopiér link"}
                  </button>
                </div>
              </div>
            </div>

            {/* 2: Faerdigt skilt til print */}
            <div className="flex flex-col gap-4 rounded-lg border border-fog bg-white shadow-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-moss/10 text-[0.8rem] font-[500] text-moss">
                  2
                </span>
                <h3 className="font-[400] text-[1rem] text-ink">
                  Færdigt skilt
                </h3>
              </div>
              <p className="font-[200] text-[0.82rem] leading-relaxed text-stone">
                Et flot, færdigt skilt du bare printer og sætter op. Vælg
                størrelse:
              </p>
              <div className="mt-auto flex flex-col gap-2">
                {(
                  [
                    ["plakat", "A4-plakat"],
                    ["a5", "A5-skilt"],
                    ["visitkort", "Visitkort"],
                  ] as const
                ).map(([t, label]) => (
                  <a
                    key={t}
                    href={`/api/materials/${t}?slug=${created.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className={btnClass("outline")}
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Tydelig login-CTA i midten */}
          <div className="flex flex-col items-center gap-3 rounded-lg border border-moss/30 bg-moss/[0.05] p-8 text-center">
            <form action={sendOnboardingLogin}>
              <input type="hidden" name="email" value={email} />
              <SubmitButton
                variant="primary"
                size="lg"
                pendingText="Sender login-link..."
              >
                Log ind på dit dashboard
              </SubmitButton>
            </form>
            <p className="max-w-sm font-[200] text-[0.74rem] leading-relaxed text-slate">
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
