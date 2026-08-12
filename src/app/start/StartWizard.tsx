"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CardDesigner,
  DEFAULT_DESIGN,
  type CardDesign,
} from "@/components/CardDesigner";
import { StampCard } from "@/components/StampCard";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
import { btnClass } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { LoyaltyStory } from "./LoyaltyStory";
import {
  createBusinessAction,
  loginWithOnboardingToken,
  recordOnboardingStep,
  type CreateResult,
} from "./actions";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

// Progressiv onboarding: eet naturligt sporgsmaal ad gangen, med et vedvarende
// live preview af kortet ved siden af og auto-gemt fremskridt. Faerre felter pr.
// skaerm = roligere, mere Apple-agtig foelelse. Vi forklarer VAERDIEN af hvert
// trin, ikke bare hvad der skal skrives.
const STEPS = ["Din butik", "Design kortet", "Opsætning", "Klar"];
const DESIGN_STEP = 1;
// Sidste input-trin: praktiske detaljer, vilkaar og "Opret min butik".
const SETUP_STEP = 2;
const DONE_STEP = 3;
const STORAGE_KEY = "stemplet-onboarding-v1";

const STEP_INFO: Record<number, { title: string; value: string }> = {
  0: {
    title: "Din butik",
    value:
      "Navnet står på kundens kort, og e-mailen er dit login. Ingen adgangskode at huske.",
  },
  1: {
    title: "Design kortet",
    value:
      "Gør kortet til dit. Det er præcis dette, kunderne ser i deres Apple Wallet.",
  },
  2: {
    title: "Opsætning",
    value:
      "Sidste trin. Tilføj gerne en adresse, så kortet dukker op på kundens låseskærm i nærheden. Alt kan ændres senere i dashboardet.",
  },
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
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");
  // Sat naar en rigtig adresse er valgt fra listen (til synlig bekraeftelse).
  const [addrConfirmed, setAddrConfirmed] = useState(false);
  const [design, setDesign] = useState<CardDesign>(DEFAULT_DESIGN);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Extract<CreateResult, { ok: true }> | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [hydrated, setHydrated] = useState(false);
  // Funnel-maaling: et anonymt id (localStorage) og hvilke trin vi allerede har
  // registreret i denne indlaesning, saa vi ikke sender dubletter.
  const anonIdRef = useRef<string | null>(null);
  const firedStepsRef = useRef<Set<number>>(new Set());

  // Auto-gem: gendan tidligere fremskridt fra localStorage, saa en
  // genindlaesning (eller et uheld) ikke starter forfra.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.name === "string") setName(s.name);
        if (typeof s.email === "string") setEmail(s.email);
        if (typeof s.category === "string") setCategory(s.category);
        if (typeof s.address === "string") setAddress(s.address);
        if (typeof s.addrConfirmed === "boolean") setAddrConfirmed(s.addrConfirmed);
        if (s.design && typeof s.design === "object")
          setDesign({ ...DEFAULT_DESIGN, ...s.design });
        if (typeof s.acceptedTerms === "boolean") setAcceptedTerms(s.acceptedTerms);
        if (typeof s.step === "number")
          setStep(Math.max(0, Math.min(s.step, SETUP_STEP)));
      }
    } catch {
      /* ignorer korrupt gemt tilstand */
    }
    setHydrated(true);
  }, []);

  // Gem loebende (efter hydrering, og ikke naar butikken allerede er oprettet).
  useEffect(() => {
    if (!hydrated || created) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          name,
          email,
          category,
          address,
          addrConfirmed,
          design,
          acceptedTerms,
          step: Math.min(step, SETUP_STEP),
        }),
      );
    } catch {
      /* fx privat-tilstand uden storage */
    }
  }, [
    hydrated,
    created,
    name,
    email,
    category,
    address,
    addrConfirmed,
    design,
    acceptedTerms,
    step,
  ]);

  // Start altid oeverst paa hvert trin (ellers lander man midt paa siden efter
  // "Opret min butik" og gaar glip af "Du er klar"-fejringen).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Anonymt funnel-id (ingen persondata), stabilt paa tvaers af genindlaesninger.
  useEffect(() => {
    try {
      let id = localStorage.getItem("stemplet-onboarding-anon");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("stemplet-onboarding-anon", id);
      }
      anonIdRef.current = id;
    } catch {
      /* privat-tilstand uden storage: saa maaler vi bare ikke */
    }
  }, []);

  // Registrér hvert trin, der naaes (een gang pr. trin pr. indlaesning). Trin 3
  // (Klar) naaes kun efter en fuldfoert oprettelse, saa det ER konverteringen.
  useEffect(() => {
    const id = anonIdRef.current;
    if (!id || firedStepsRef.current.has(step)) return;
    firedStepsRef.current.add(step);
    recordOnboardingStep(id, step).catch(() => {
      /* transport-fejl: funnel-maaling maa aldrig braekke flowet */
    });
  }, [step]);

  // Navnet paa kortet: valgt kort-navn, ellers firmanavnet, ellers en pladsholder.
  const cardName = design.displayName?.trim() || name.trim() || "Din butik";

  function next() {
    setError(null);
    if (step === 0) {
      if (name.trim().length < 2)
        return setError(
          "Skriv butikkens navn (mindst 2 tegn). Det står på kundens kort.",
        );
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
        return setError(
          "Skriv en gyldig e-mail, fx navn@butik.dk. Det er dit login.",
        );
    }
    // Trin 1 (Opsætning) er valgfrit: intet at validere.
    setStep((s) => Math.min(s + 1, DONE_STEP));
  }

  // Enter i et felt paa trin 0/1 gaar videre (samme som "Fortsæt").
  function onFieldEnter(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      next();
    }
  }

  function submit() {
    setError(null);
    if (!acceptedTerms) {
      return setError(
        "Sæt flueben ved betingelserne nederst, så kan du oprette butikken.",
      );
    }
    startTransition(async () => {
      const res = await createBusinessAction({
        name,
        email,
        category,
        address,
        design,
        acceptedTerms,
      });
      if (res.ok) {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ligegyldigt */
        }
        setCreated(res);
        setStep(DONE_STEP);
      } else {
        setError(res.error);
        // Hop til det trin, hvor feltet med fejlen staar.
        if (res.field === "address") setStep(SETUP_STEP);
        else if (res.field === "email") setStep(0);
      }
    });
  }

  // ── Vedvarende live preview (trin 0-2) ────────────────────────────────
  const livePreview = (
    <div className="lg:sticky lg:top-8">
      <p className="mb-3 text-[0.66rem] font-[500] uppercase tracking-[0.16em] text-slate">
        Sådan ser dit kort ud
      </p>
      <StampCard
        businessName={cardName}
        logoUrl={design.logoUrl}
        primaryColor={design.primaryColor}
        textColor={design.textColor}
        stampIcon={design.stampIcon}
        stamps={Math.min(3, design.stampsRequired)}
        required={design.stampsRequired}
        rewardText={design.rewardText}
        serial="STEMPLET01"
        serialLabel={cardName}
      />
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Trin-indikator: fuldfoerte trin faar et flueben, det aktive popper blidt. */}
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
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_minmax(0,21rem)] lg:items-start lg:gap-12">
          {/* Formular-panel (paa mobil UNDER preview'et) */}
          <div className="order-2 flex flex-col gap-6 lg:order-none">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-[300] text-[1.6rem] tracking-[-0.01em] text-ink">
                {STEP_INFO[step].title}
              </h2>
              <p className="font-[300] text-[0.92rem] leading-relaxed text-stone">
                {STEP_INFO[step].value}
              </p>
            </div>

            {/* Trin 0: navn + login-mail */}
            {step === 0 ? (
              <div className="flex flex-col gap-5 animate-step">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                    Firmanavn
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={onFieldEnter}
                    autoFocus
                    maxLength={60}
                    className="border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
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
                    onKeyDown={onFieldEnter}
                    autoComplete="email"
                    inputMode="email"
                    className="border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
                  />
                </label>
              </div>
            ) : null}

            {/* Trin 1: design (preview'et vises i sidepanelet). Fokuseret paa
                design alene, saa vilkaar ligger paa naeste trin. */}
            {step === DESIGN_STEP ? (
              <div className="flex flex-col gap-5 animate-step">
                <CardDesigner
                  value={design}
                  onChange={setDesign}
                  businessName={name}
                  allowLogo
                  hidePreview
                />
              </div>
            ) : null}

            {/* Trin 2: praktiske detaljer + vilkaar. Sidste trin foer oprettelse. */}
            {step === SETUP_STEP ? (
              <div className="flex flex-col gap-4 animate-step">
                <label className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
                  <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                    Branche (valgfri)
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
                  <span className="text-[0.74rem] font-[300] leading-relaxed text-stone">
                    Hjælper os med at give dig relevante skabeloner og tips.
                  </span>
                </label>

                <div className="flex flex-col gap-1.5 rounded-lg border border-fog bg-white p-4">
                  <div className="flex items-center gap-2">
                    <PinIcon />
                    <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                      Placering til låseskærm (valgfri)
                    </span>
                  </div>
                  <p className="font-[300] text-[0.8rem] leading-relaxed text-stone">
                    Skriv butikkens adresse, så dukker kortet op på kundens
                    låseskærm, når de er i nærheden.
                  </p>
                  <div className="mt-1">
                    <AddressAutocomplete
                      value={address}
                      onChange={(nextVal) => {
                        setAddress(nextVal);
                        setAddrConfirmed(false);
                      }}
                      onSelect={() => setAddrConfirmed(true)}
                      placeholder="Begynd at skrive, og vælg din adresse"
                      className="w-full border border-clay bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
                    />
                    {addrConfirmed ? (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[0.78rem] font-[400] text-terracotta">
                        <CheckIcon className="h-3.5 w-3.5" />
                        Adresse fundet og bekræftet
                      </p>
                    ) : (
                      <p className="mt-2 text-[0.74rem] font-[300] text-slate">
                        Vælg din adresse fra listen, så er postnummeret altid
                        rigtigt.
                      </p>
                    )}
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3 border-t border-fog pt-5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-terracotta"
                  />
                  <span className="text-[0.78rem] font-[300] leading-relaxed text-stone">
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

            {error ? (
              <p className="text-[0.85rem] font-[300] leading-relaxed text-rust">
                {error}
              </p>
            ) : null}

            {/* Navigation */}
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
              {step < SETUP_STEP ? (
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
          </div>

          {/* Preview-panel (paa mobil OEVERST) */}
          <aside className="order-1 lg:order-none">{livePreview}</aside>
        </div>
      ) : null}

      {step === DONE_STEP && created ? (
        <div className="mx-auto mt-4 flex w-full max-w-2xl flex-col items-center gap-8 animate-step">
          <div className="text-center">
            {/* Stempel-landing: brandets "dopamin, ikke konfetti"-bevaegelse. */}
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
              Din butik er klar
            </h2>
          </div>

          {/* Primaer handling: direkte ind til den guidede Kom i gang */}
          {created.loginToken ? (
            <form action={loginWithOnboardingToken} className="w-full max-w-xs">
              <input type="hidden" name="token" value={created.loginToken} />
              <input type="hidden" name="dest" value="/app/kom-i-gang" />
              <SubmitButton
                variant="primary"
                size="lg"
                className="w-full"
                pendingText="Åbner..."
              >
                Gå til Kom i gang
              </SubmitButton>
            </form>
          ) : (
            <a
              href="/login"
              className={`${btnClass("primary", "lg")} w-full max-w-xs`}
            >
              Gå til login
            </a>
          )}

          {/* A til Z: hvordan kortet skaber loyalitet, i butikkens eget design */}
          <LoyaltyStory
            businessName={cardName}
            serialLabel={cardName}
            qrDataUrl={created.qrDataUrl}
            primaryColor={design.primaryColor}
            textColor={design.textColor}
            stampIcon={design.stampIcon}
            stampsRequired={design.stampsRequired}
            rewardText={design.rewardText}
            logoUrl={design.logoUrl}
          />
        </div>
      ) : null}
    </div>
  );
}
