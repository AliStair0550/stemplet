"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { CardDesigner, DEFAULT_DESIGN, type CardDesign } from "@/components/CardDesigner";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { btnClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import {
  createBusinessAction,
  sendOnboardingLogin,
  loginWithOnboardingToken,
  type CreateResult,
} from "./actions";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

// Progressiv onboarding: vi starter med det absolut vigtigste (navn + login-mail),
// tager praktiske detaljer bagefter, og designer kortet til sidst. Faerre felter
// pr. skaerm = roligere, mere Apple-agtig foelelse.
const STEPS = ["Din butik", "Opsætning", "Design kortet", "Klar"];
const DESIGN_STEP = 2;
const DONE_STEP = 3;

const SUBTITLES: Record<number, string> = {
  0: "Vi starter med det vigtigste: butikkens navn og hvor du logger ind.",
  1: "Et par praktiske detaljer. Du kan ændre det hele senere i dashboardet.",
  2: "Gør kortet til dit. Vælg farver, ikon og belønning.",
};

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-terracotta"
      aria-hidden
    >
      <path d="M12 21s-6-5.686-6-10a6 6 0 1 1 12 0c0 4.314-6 10-6 10z" />
      <circle cx="12" cy="11" r="2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
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
  // Sat naar en rigtig adresse er valgt fra listen (til synlig bekraeftelse).
  const [addrConfirmed, setAddrConfirmed] = useState(false);
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Extract<CreateResult, { ok: true }> | null>(null);
  const [pending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Start altid oeverst paa hvert trin. Ellers lander man midt paa siden efter
  // "Opret min butik" (nederst paa design-trinnet) og gaar glip af "Du er
  // klar"-stemplet. Instant, saa fejringen ses fra foerste frame.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

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
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return setError("Skriv en gyldig e-mail.");
    }
    if (step === 1) {
      if (!/^\d{4,6}$/.test(pin)) return setError("PIN skal være 4 til 6 cifre.");
    }
    setStep((s) => Math.min(s + 1, DONE_STEP));
  }

  function submit() {
    setError(null);
    // Vis en tydelig besked i stedet for en "doed" graa knap, hvis fluebenet
    // ved betingelserne mangler.
    if (!acceptedTerms) {
      return setError(
        "Sæt flueben ved betingelserne nederst, så kan du oprette butikken.",
      );
    }
    startTransition(async () => {
      const res = await createBusinessAction({ name, email, pin, category, address, design, acceptedTerms });
      if (res.ok) {
        setCreated(res);
        setStep(DONE_STEP);
      } else {
        setError(res.error);
        // Hop til det trin, hvor feltet med fejlen staar, saa beskeden giver
        // mening (ellers strander man paa design-trinnet uden at kunne rette).
        if (res.field === "address") setStep(1);
        else if (res.field === "email") setStep(0);
      }
    });
  }

  return (
    <div
      className={`mx-auto flex w-full flex-col gap-8 ${
        step >= DESIGN_STEP ? "max-w-4xl" : "max-w-2xl"
      }`}
    >
      {/* Trin-indikator med en lille dopamin: fuldfoerte trin faar et flueben, og
          det netop aktiverede trin popper blidt med en bloed ring-ripple. */}
      <ol className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2.5">
              <span className="relative flex h-7 w-7 shrink-0 items-center justify-center">
                {active ? (
                  <span
                    key={`ripple-${step}`}
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-terracotta/50 [animation:stampRipple_0.7s_ease-out_both]"
                  />
                ) : null}
                <span
                  key={active ? `dot-active-${step}` : `dot-${i}`}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[0.72rem] transition-colors ${
                    done || active
                      ? "bg-terracotta text-parchment"
                      : "bg-fog text-slate"
                  } ${active ? "[animation:cardReceive_0.4s_ease-out]" : ""}`}
                >
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : i + 1}
                </span>
              </span>
              <span
                className={`hidden text-[0.72rem] font-[300] uppercase tracking-[0.1em] sm:block ${
                  i <= step ? "text-ink" : "text-slate"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {step < DONE_STEP ? (
        <div className="flex flex-col gap-1.5">
          <h2 className="font-[300] text-[1.6rem] tracking-[-0.01em] text-ink">
            {STEPS[step]}
          </h2>
          <p className="font-[200] text-[0.92rem] leading-relaxed text-stone">
            {SUBTITLES[step]}
          </p>
        </div>
      ) : null}

      {/* Trin 0: det vigtigste - navn + login-mail */}
      {step === 0 ? (
        <div className="flex flex-col gap-5 animate-step">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Firmanavn
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              maxLength={60}
              className="border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-terracotta"
            />
            <span className="text-[0.74rem] font-[300] leading-relaxed text-stone">
              Firmanavnet, fx Pizzeria ApS. Du vælger selv, hvad der står på
              kortet, når du designer det.
            </span>
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
              className="border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-terracotta"
            />
            <span className="text-[0.74rem] font-[300] leading-relaxed text-stone">
              Du logger ind uden adgangskode. Vi sender et link til denne mail.
            </span>
          </label>
        </div>
      ) : null}

      {/* Trin 1: praktiske detaljer - hver i sit eget kort, saa de ikke flyder sammen */}
      {step === 1 ? (
        <div className="flex flex-col gap-4 animate-step">
          {/* Personale-PIN */}
          <label className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Personale-PIN
            </span>
            <input
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="4 til 6 cifre"
              className="w-40 border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] tracking-[0.3em] text-ink outline-none focus:border-terracotta"
            />
            <span className="text-[0.74rem] font-[200] leading-relaxed text-slate">
              Bruges når personalet indløser en fyldt belønning ved kassen. Du
              kan altid ændre den senere.
            </span>
          </label>

          {/* Branche */}
          <label className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Branche
            </span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
            >
              <option value="">Vælg branche</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          {/* Placering til laaseskaerm */}
          <div className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
            <div className="flex items-center gap-2">
              <PinIcon />
              <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                Placering til låseskærm (valgfri)
              </span>
            </div>
            <p className="font-[200] text-[0.8rem] leading-relaxed text-stone">
              Skriv butikkens adresse, så dukker kortet op på kundens låseskærm,
              når de er i nærheden.
            </p>
            <div className="mt-1">
              <AddressAutocomplete
                value={address}
                onChange={(next) => {
                  setAddress(next);
                  setAddrConfirmed(false);
                }}
                onSelect={() => setAddrConfirmed(true)}
                placeholder="Begynd at skrive, og vælg din adresse"
                className="w-full border border-clay bg-parchment px-4 py-3 font-[200] text-[0.95rem] text-ink outline-none focus:border-terracotta"
              />
              {addrConfirmed ? (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] font-[400] text-terracotta">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3.5 w-3.5"
                    aria-hidden
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Adresse fundet og bekræftet
                </p>
              ) : (
                <p className="mt-2 text-[0.74rem] font-[200] text-slate">
                  Vælg din adresse fra listen, så er postnummeret altid rigtigt.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Trin 2: design + vilkaar */}
      {step === DESIGN_STEP ? (
        <div className="flex flex-col gap-5 animate-step">
          <CardDesigner
            value={design}
            onChange={setDesign}
            businessName={name}
            allowLogo
          />
          <label className="flex cursor-pointer items-start gap-3 border-t border-fog pt-5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta"
            />
            <span className="text-[0.78rem] font-[200] leading-relaxed text-stone">
              Jeg accepterer{" "}
              <a
                href="/handelsbetingelser"
                target="_blank"
                rel="noreferrer"
                className="text-terracotta underline underline-offset-2 hover:opacity-70"
              >
                handelsbetingelserne
              </a>
              ,{" "}
              <a
                href="/privatliv"
                target="_blank"
                rel="noreferrer"
                className="text-terracotta underline underline-offset-2 hover:opacity-70"
              >
                privatlivspolitikken
              </a>{" "}
              og{" "}
              <a
                href="/databehandleraftale"
                target="_blank"
                rel="noreferrer"
                className="text-terracotta underline underline-offset-2 hover:opacity-70"
              >
                databehandleraftalen
              </a>
              .
            </span>
          </label>
        </div>
      ) : null}

      {step === DONE_STEP && created ? (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 animate-step">
          <div className="text-center">
            {/* Stempel-landing: brandets egen "dopamin, ikke konfetti"-bevaegelse.
                Et stempel der presses ned og "lander" som kvittering for at
                butikken nu er stemplet ind. Prominent, men roligt. Under
                prefers-reduced-motion staar kun det rolige flueben-stempel. */}
            <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
              <span
                aria-hidden
                className="absolute h-16 w-16 rounded-full bg-terracotta/25 blur-2xl [animation:stampBloom_1.2s_ease-out_both]"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-terracotta/40 [animation:stampRipple_1s_ease-out_0.15s_both]"
              />
              <span
                aria-hidden
                className="absolute inset-0 rounded-full border-2 border-terracotta/25 [animation:stampRipple_1.15s_ease-out_0.4s_both]"
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-terracotta text-parchment shadow-[0_10px_30px_-8px_rgba(166,80,46,0.65)] [animation:stampPop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_both]">
                <CheckIcon className="h-7 w-7" />
              </span>
            </div>
            <h2 className="font-fraunces font-light italic text-[1.9rem] text-ink">
              Du er klar
            </h2>
            <p className="mx-auto mt-3 max-w-md font-[200] text-[0.9rem] leading-relaxed text-stone">
              Sæt kortet op i butikken og del det online, så samler kunderne
              stempler i deres Wallet.
            </p>
          </div>

          {/* Primaer handling: kom DIREKTE ind i dashboardet (auto-login), saa
              ejeren ikke behoever at aabne mailen. Login-mailen er backup. */}
          <div className="rounded-lg border border-terracotta/30 bg-terracotta/[0.05] p-6 text-center md:p-8">
            <h4 className="font-[400] text-[1.15rem] text-ink">
              Kom ind i dit dashboard
            </h4>
            <p className="mx-auto mt-2 max-w-md font-[300] text-[0.88rem] leading-relaxed text-stone">
              Gå direkte ind, hvor du henter QR og skilte til print, deler kortet
              og giver det første stempel. Vi guider dig hele vejen.
            </p>
            {created.loginToken ? (
              <form
                action={loginWithOnboardingToken}
                className="mt-5 flex justify-center"
              >
                <input type="hidden" name="token" value={created.loginToken} />
                <SubmitButton
                  variant="primary"
                  size="lg"
                  pendingText="Åbner dashboard..."
                >
                  Gå til mit dashboard
                </SubmitButton>
              </form>
            ) : null}
            <p className="mx-auto mt-4 max-w-md font-[300] text-[0.8rem] leading-relaxed text-slate">
              {created.loginSent
                ? `Vi har også sendt et login-link til ${email}, så du kan logge ind fra andre enheder. Tjek spam-mappen, hvis mailen ikke dukker op.`
                : `Vil du hellere logge ind via mail? Så sender vi et link til ${email}.`}
            </p>
            <form action={sendOnboardingLogin} className="mt-2 flex justify-center">
              <input type="hidden" name="email" value={email} />
              <SubmitButton
                variant="outline"
                size="md"
                pendingText="Sender login-link..."
              >
                {created.loginSent ? "Send login-link igen" : "Send login-link"}
              </SubmitButton>
            </form>
          </div>

          {/* Dit stempelkort: QR til download og deling (sekundaert) */}
          <div className="flex flex-col items-center gap-5 rounded-lg border border-fog bg-white p-6 shadow-card md:p-8">
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-slate">
              Dit stempelkort
            </span>
            <div className="relative p-2.5">
              <Image
                src={created.qrDataUrl}
                width={190}
                height={190}
                alt="QR-kode til dit stempelkort"
                unoptimized
                className="h-[180px] w-[180px] rounded-[6px]"
              />
              {(
                [
                  "left-0 top-0 rounded-tl-[10px] border-l-[2.5px] border-t-[2.5px]",
                  "right-0 top-0 rounded-tr-[10px] border-r-[2.5px] border-t-[2.5px]",
                  "bottom-0 left-0 rounded-bl-[10px] border-b-[2.5px] border-l-[2.5px]",
                  "bottom-0 right-0 rounded-br-[10px] border-b-[2.5px] border-r-[2.5px]",
                ] as const
              ).map((c) => (
                <span
                  key={c}
                  aria-hidden
                  className={`pointer-events-none absolute h-6 w-6 border-terracotta ${c}`}
                />
              ))}
            </div>
            <div className="flex w-full flex-wrap justify-center gap-2">
              <a
                href={created.qrDataUrl}
                download={`${created.slug}-stempelkort-qr.png`}
                className={btnClass("outline")}
              >
                Download QR
              </a>
              <button
                type="button"
                onClick={shareCard}
                className={btnClass("outline")}
              >
                Del kort
              </button>
              <button
                type="button"
                onClick={copyLink}
                className={btnClass("outline")}
              >
                {copied ? "Kopieret" : "Kopiér link"}
              </button>
            </div>
            <a
              href={created.cardUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[0.8rem] font-[400] text-terracotta transition-opacity hover:opacity-70"
            >
              Se kortet
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="text-[0.82rem] font-[200] text-rust">{error}</p>
      ) : null}

      {/* Navigation */}
      {step < DONE_STEP ? (
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
          {step < DESIGN_STEP ? (
            <button onClick={next} className={btnClass("primary")}>
              Fortsæt
            </button>
          ) : (
            <button
              onClick={submit}
              disabled={pending}
              className={`${btnClass("terracotta")} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {pending ? "Opretter..." : "Opret min butik"}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
