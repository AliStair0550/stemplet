"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ButtonLink, btnClass } from "@/components/ui";
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
  const ran = useRef(false);
  const icon = stampIcon as StampIconKey;

  const doStamp = useCallback(async () => {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.ok) {
        // Reward: festlig rytme. Alm. stempel: et blOEdt "press-settle".
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : [14, 45, 26]);
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
  }, [token]);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    doStamp();
  }, [doStamp]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-parchment px-6 py-12 text-center">
      <Celebration show={state.phase === "done" && state.rewardReady} />

      {state.phase === "loading" ? (
        // Loading er en ghost af selve stemplet, saa den toner over i succes.
        <div className="flex flex-col items-center gap-5">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full bg-moss/15"
              style={{ animation: "stampRing 1.3s ease-out infinite" }}
            />
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-moss/10 text-moss">
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
                ? "Tillykke"
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
                ? "Dit kort er fuldt"
                : `${cap(talDk(state.stamps))} af ${talDk(state.required)}`}
            </h1>
          </div>

          {/* Stempel-landingen: kortet MODTAGER stemplet med en blOEd glOEd-bloom
              og en ring der breder sig ud. Kortet er helten, det nye stempel
              popper ind. Elegant og dybt, ikke konfetti. */}
          <div className="relative">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-8 rounded-[2.2rem] bg-moss/30 blur-3xl"
              style={{ animation: "stampBloom 1.25s ease-out forwards" }}
            />
            {/* To ringe der breder sig ud (den anden lidt forskudt) for et
                rigere, tydeligere "impact". */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[1.7rem] border-2 border-moss/50"
              style={{
                animation: "stampRipple 0.95s cubic-bezier(0.16,1,0.3,1) forwards",
              }}
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-[1.7rem] border border-moss/30"
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
          </div>

          <p className="font-[300] text-[0.9rem] leading-relaxed text-stone">
            {state.rewardReady
              ? "Vis dit kort ved kassen og få din belønning."
              : state.created
                ? "Læg kortet i din Apple Wallet, så er det klar til næste besøg."
                : `${state.required - state.stamps} ${
                    state.required - state.stamps === 1 ? "stempel" : "stempler"
                  } tilbage til din belønning.`}
          </p>

          {/* Wallet er den ene, tydelige handling: kunden gemmer kortet med det
              samme. "Se dit kort" ligger diskret under som en tekst-genvej. */}
          <div className="flex w-full flex-col items-center gap-3">
            {walletEnabled && !state.rewardReady ? (
              <>
                <a
                  href={`/api/wallet/pass/${state.serial}`}
                  className={btnClass("primary", "lg") + " w-full max-w-xs"}
                >
                  Læg i Apple Wallet
                </a>
                <a
                  href={`/kort/${state.serial}`}
                  className="text-[0.78rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-ink"
                >
                  Se dit kort
                </a>
              </>
            ) : (
              <ButtonLink
                href={`/kort/${state.serial}`}
                variant="primary"
                size="lg"
                className="w-full max-w-xs"
              >
                Se dit kort
              </ButtonLink>
            )}
          </div>
        </div>
      ) : null}

      {state.phase === "needCard" ? (
        <div className="flex flex-col items-center gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss/10 text-moss">
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

            // Kunden HAR et kort her (allerede stemplet / cooldown / fuldt) ->
            // send dem hen til deres eget kort, hvor de kan vise QR'en til
            // personalet (som scanner uden cooldown). Ingen doed "Proev igen".
            if (
              (s.code === "REPLAY" ||
                s.code === "COOLDOWN" ||
                s.code === "FULL") &&
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
                    : {
                        kicker: "Fuldt kort",
                        title: "Dit kort er fuldt",
                        body: "Vis det ved kassen, så får du din belønning.",
                        cta: "Vis mit kort",
                        href: `/kort/${s.serial}?vis=1`,
                      };
              return (
                <div className="flex w-full max-w-sm flex-col items-center gap-5">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-moss/10 text-moss">
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
