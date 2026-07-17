"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ButtonLink,
  btnClass,
  CtaGlow,
  WalletIcon,
  CTA_EMPHASIS,
} from "@/components/ui";
import { Celebration } from "@/components/Celebration";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import type { StampIconKey } from "@/lib/brand";

// Tal i ord til det lille Fraunces-accent-hovede ("Fire af ti").
const TAL_DK = [
  "nul", "en", "to", "tre", "fire", "fem", "seks",
  "syv", "otte", "ni", "ti", "elleve", "tolv",
];
const talDk = (n: number) => (n >= 0 && n < TAL_DK.length ? TAL_DK[n] : String(n));
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // haptics er valgfrit
  }
}

const ERROR_GLYPH = (
  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-clay/40 text-stone">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5M12 16h.01" />
    </svg>
  </span>
);

type State =
  | { phase: "loading" }
  | {
      phase: "done";
      stamps: number;
      required: number;
      serial: string;
      rewardReady: boolean;
      increment: number;
      created: boolean;
    }
  | { phase: "needCard" }
  | { phase: "error"; code: string; message: string; serial?: string };

export function StampConfirm({
  token,
  slug,
  businessName,
  primaryColor,
  textColor,
  logoUrl,
  stampIcon,
  rewardText,
  walletEnabled,
}: {
  token: string;
  slug: string;
  businessName: string;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  stampIcon: string;
  rewardText: string;
  walletEnabled: boolean;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });
  // Sandt hvis telefonen ikke kunne gemme kortet (privat browsing blokerer
  // baade cookie og localStorage). Saa ville hver scanning ellers oprette et nyt
  // kort i tavshed. Vi forklarer det og peger paa Apple Wallet, som husker
  // kortet uanset browser-tilstand.
  const [storageBlocked, setStorageBlocked] = useState(false);
  const ran = useRef(false);
  const icon = stampIcon as StampIconKey;

  const doStamp = useCallback(async () => {
    setState({ phase: "loading" });
    // Gemt kort-token (localStorage) som robust fallback, hvis device-cookien
    // ikke holdt paa denne telefon. Saa samler kunden op paa SAMME kort.
    const storeKey = `stmpl_${slug}`;
    let known: string | null = null;
    try {
      known = localStorage.getItem(storeKey);
    } catch {
      // localStorage kan vaere blokeret (privat browsing) - saa faldes tilbage
      // paa cookien alene.
    }
    try {
      const res = await fetch("/api/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, known }),
      });
      const data = await res.json();
      if (data.ok) {
        // Husk kortet paa denne enhed til naeste scanning.
        try {
          if (data.cardToken) localStorage.setItem(storeKey, data.cardToken);
        } catch {
          // localStorage blokeret (privat browsing) -> kortet kan ikke huskes
          // her. Vis en venlig forklaring og peg paa Apple Wallet.
          setStorageBlocked(true);
        }
        // Reward: festlig rytme. Foerste kort (velkomst): en rigere puls. Alm.
        // stempel: et blOEdt "press-settle".
        haptic(
          data.rewardReady
            ? [30, 50, 30, 50, 90]
            : data.created
              ? [22, 40, 22, 55]
              : [14, 45, 26],
        );
        setState({
          phase: "done",
          stamps: data.stamps,
          required: data.required,
          serial: data.serial,
          rewardReady: data.rewardReady,
          increment: data.increment,
          created: !!data.created,
        });
      } else if (data.needCard) {
        setState({ phase: "needCard" });
      } else {
        setState({
          phase: "error",
          code: data.code ?? "SERVER",
          message: data.message ?? "Noget gik galt.",
          serial: data.serial,
        });
      }
    } catch {
      setState({
        phase: "error",
        code: "NETWORK",
        message: "Ingen forbindelse. Prøv igen.",
      });
    }
  }, [token, slug]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    doStamp();
  }, [doStamp]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-parchment px-6 py-12 text-center">
      {/* Konfetti baade ved den fulde beloenning OG ved allerfoerste kort
          (velkomst), saa kundens foerste indtryk gnistrer. */}
      <Celebration
        show={state.phase === "done" && (state.rewardReady || state.created)}
      />

      {state.phase === "loading" ? (
        // Loading er en ghost af selve stemplet, saa den toner over i succes.
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-terracotta/15"
              style={{ animation: "stampRing 1.3s ease-out infinite" }}
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
              <StampIcon icon={icon} className="h-9 w-9" />
            </div>
          </div>
          <p className="font-[300] text-[0.9rem] text-stone">
            Giver dig dit stempel...
          </p>
        </div>
      ) : null}

      {state.phase === "done" ? (
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-ink">
              {state.rewardReady
                ? "Belønning låst op"
                : state.created
                  ? "Velkommen"
                  : state.increment > 1
                    ? "Dobbeltstempel"
                    : "Stempel modtaget"}
            </span>
            <h1
              className="font-fraunces font-light italic text-[1.9rem] leading-tight text-ink"
              style={{
                animation: "countPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              {state.rewardReady
                ? "Din belønning er klar"
                : state.stamps === 0
                  ? "Dit kort er klar"
                  : `${cap(talDk(state.stamps))} af ${talDk(state.required)}`}
            </h1>
          </div>

          {/* Stempel-landingen: kortet MODTAGER stemplet med en blOEd glOEd-bloom
              og en ring der breder sig ud. Kortet er helten, det nye stempel
              popper ind. Elegant og dybt, ikke konfetti. */}
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-[2.2rem] bg-terracotta/30 blur-3xl"
              style={{ animation: "stampBloom 1.25s ease-out forwards" }}
            />
            {/* To ringe der breder sig ud (den anden lidt forskudt) for et
                rigere, tydeligere "impact". */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[1.7rem] border-2 border-terracotta/50"
              style={{
                animation: "stampRipple 0.95s cubic-bezier(0.16,1,0.3,1) forwards",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[1.7rem] border border-terracotta/30"
              style={{
                animation:
                  "stampRipple 1.15s cubic-bezier(0.16,1,0.3,1) 0.18s forwards",
              }}
            />
            <div
              style={{
                animation:
                  "cardReceive 0.75s cubic-bezier(0.34,1.56,0.64,1) both",
              }}
            >
              <StampCard
                businessName={businessName}
                logoUrl={logoUrl}
                primaryColor={primaryColor}
                textColor={textColor}
                stampIcon={icon}
                stamps={state.stamps}
                required={state.required}
                rewardText={rewardText}
                pop
              />
            </div>
            {/* Flyvende "+1 stempel": en lille, tydelig dopamin-kvittering paa
                hvert stempel (paa beloenningsskaermen taler gaven for sig selv). */}
            {!state.rewardReady && state.increment > 0 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 select-none rounded-full bg-terracotta px-3.5 py-1 text-[0.82rem] font-[400] text-white shadow-lift"
                style={{ animation: "plusOne 1.25s ease-out 0.15s both" }}
              >
                +{state.increment}{" "}
                {state.increment === 1 ? "stempel" : "stempler"}
              </span>
            ) : null}
          </div>

          <p className="font-[300] text-[0.9rem] leading-relaxed text-stone">
            {state.rewardReady
              ? "Vis dit kort ved kassen og få din belønning."
              : state.created
                ? "Læg kortet i din Apple Wallet, så er du klar til dit næste besøg."
                : `${state.required - state.stamps} ${
                    state.required - state.stamps === 1 ? "stempel" : "stempler"
                  } tilbage til din belønning.`}
          </p>

          {/* Wallet er den ene, tydelige handling. Kortet ses allerede ovenfor,
              saa ingen "Se dit kort"-genvej her. Naar der ER en beloenning klar
              (eller ingen Wallet), foerer knappen hen til kortets scanbare QR. */}
          <div className="flex w-full flex-col items-center gap-3">
            {walletEnabled && !state.rewardReady ? (
              <CtaGlow className="w-full max-w-xs">
                <a
                  href={`/api/wallet/pass/${state.serial}`}
                  className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS}`}
                >
                  <WalletIcon />
                  Læg i Apple Wallet
                </a>
              </CtaGlow>
            ) : (
              <ButtonLink
                href={`/kort/${state.serial}?vis=1`}
                variant="primary"
                size="lg"
                className="w-full max-w-xs"
              >
                Vis kort ved kassen
              </ButtonLink>
            )}
          </div>

          {/* Privat browsing: telefonen kan ikke huske kortet mellem besOEg.
              Forklar det og peg paa Wallet, som husker det uanset. */}
          {storageBlocked ? (
            <p className="max-w-xs rounded-xl bg-sand/60 px-4 py-3 font-[300] text-[0.82rem] leading-relaxed text-stone">
              Din browser husker ikke kortet automatisk (måske privat browsing).
              Læg det i Apple Wallet, så har du det altid, eller åbn siden i en
              normal fane.
            </p>
          ) : null}
        </div>
      ) : null}

      {state.phase === "needCard" ? (
        <div className="flex flex-col items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
            <StampIcon icon={icon} className="h-8 w-8" />
          </span>
          <h1 className="font-[300] text-[1.4rem] text-ink">
            Hent dit stempelkort først
          </h1>
          <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
            Du mangler et kort hos {businessName}. Det tager fem sekunder.
          </p>
          <ButtonLink href={`/k/${slug}`} variant="primary" size="lg">
            Hent dit kort
          </ButtonLink>
        </div>
      ) : null}

      {state.phase === "error"
        ? (() => {
            const s = state;

            // Selvbetjening slaaet fra: personalet giver stemplet. Peg kunden
            // paa at vise kortet (eller hente det foerst).
            if (s.code === "SELF_SCAN_OFF") {
              return (
                <div className="flex w-full max-w-sm flex-col items-center gap-5">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                    <StampIcon icon={icon} className="h-8 w-8" />
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-ink">
                      Vis ved kassen
                    </span>
                    <h1 className="font-[300] text-[1.5rem] leading-tight text-ink">
                      Personalet giver dig stemplet
                    </h1>
                  </div>
                  <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
                    Vis dit kort til personalet ved disken, så scanner de det og
                    giver dig dine stempler.
                  </p>
                  <ButtonLink
                    href={s.serial ? `/kort/${s.serial}?vis=1` : `/k/${slug}`}
                    variant="primary"
                    size="lg"
                  >
                    {s.serial ? "Vis mit kort" : "Hent dit kort"}
                  </ButtonLink>
                </div>
              );
            }

            // Kunden HAR et kort her (allerede stemplet / cooldown / fuldt) ->
            // send dem hen til deres eget kort, hvor de kan vise QR'en til
            // personalet (som scanner uden cooldown). Ingen doed "Proev igen".
            if (
              (s.code === "REPLAY" ||
                s.code === "COOLDOWN" ||
                s.code === "FULL" ||
                s.code === "INACTIVE") &&
              s.serial
            ) {
              const copy =
                s.code === "REPLAY"
                  ? {
                      kicker: "Allerede stemplet",
                      title: "Du har allerede fået dit stempel",
                      body: "Denne kode er brugt en gang. Dit kort er opdateret, se det her.",
                      cta: "Se dit kort",
                      href: `/kort/${s.serial}`,
                    }
                  : s.code === "COOLDOWN"
                    ? {
                        kicker: "Lige stemplet",
                        title: "Du har lige fået et stempel",
                        body: "Skal du have et til? Vis dit kort til personalet, så giver de dig stemplet med det samme.",
                        cta: "Vis mit kort",
                        href: `/kort/${s.serial}?vis=1`,
                      }
                    : s.code === "INACTIVE"
                      ? {
                          kicker: "Kort på pause",
                          title: "Kortet er sat på pause",
                          body: "Butikken tager ikke imod stempler på dette kort lige nu. Du kan stadig se dit kort her.",
                          cta: "Se dit kort",
                          href: `/kort/${s.serial}`,
                        }
                      : {
                          kicker: "Fuldt kort",
                          title: "Dit kort er fuldt",
                          body: "Vis det ved kassen, så får du din belønning.",
                          cta: "Vis mit kort",
                          href: `/kort/${s.serial}?vis=1`,
                        };
              return (
                <div className="flex w-full max-w-sm flex-col items-center gap-5">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                    <StampIcon icon={icon} className="h-8 w-8" />
                  </span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-ink">
                      {copy.kicker}
                    </span>
                    <h1 className="font-[300] text-[1.5rem] leading-tight text-ink">
                      {copy.title}
                    </h1>
                  </div>
                  <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
                    {copy.body}
                  </p>
                  <ButtonLink href={copy.href} variant="primary" size="lg">
                    {copy.cta}
                  </ButtonLink>
                </div>
              );
            }

            // Udloebet kode -> hen til deres kort via butikkens claim-side.
            if (s.code === "EXPIRED") {
              return (
                <div className="flex flex-col items-center gap-5">
                  {ERROR_GLYPH}
                  <h1 className="font-[300] text-[1.4rem] text-ink">
                    Koden er udløbet
                  </h1>
                  <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
                    Bed personalet vise den nye kode, eller vis dit eget kort ved
                    kassen.
                  </p>
                  <ButtonLink href={`/k/${slug}`} variant="primary" size="lg">
                    Åbn mit kort
                  </ButtonLink>
                </div>
              );
            }

            // Reelt forbigaaende (netvaerk/server) -> aegte "Proev igen".
            return (
              <div className="flex flex-col items-center gap-5">
                {ERROR_GLYPH}
                <h1 className="font-[300] text-[1.4rem] text-ink">Prøv igen</h1>
                <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
                  {s.message}
                </p>
                <button onClick={doStamp} className={btnClass("primary", "lg")}>
                  Prøv igen
                </button>
              </div>
            );
          })()
        : null}
    </main>
  );
}
