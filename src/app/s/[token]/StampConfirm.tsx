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

type State =
  | { phase: "loading" }
  | {
      phase: "done";
      stamps: number;
      required: number;
      serial: string;
      rewardReady: boolean;
      increment: number;
    }
  | { phase: "needCard" }
  | { phase: "error"; message: string };

export function StampConfirm({
  token,
  slug,
  businessName,
  primaryColor,
  textColor,
  logoUrl,
  stampIcon,
  rewardText,
}: {
  token: string;
  slug: string;
  businessName: string;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  stampIcon: string;
  rewardText: string;
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
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : 22);
        setState({
          phase: "done",
          stamps: data.stamps,
          required: data.required,
          serial: data.serial,
          rewardReady: data.rewardReady,
          increment: data.increment,
        });
      } else if (data.needCard) {
        setState({ phase: "needCard" });
      } else {
        setState({ phase: "error", message: data.message ?? "Noget gik galt." });
      }
    } catch {
      setState({ phase: "error", message: "Ingen forbindelse. Prøv igen." });
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
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-moss">
              {state.rewardReady
                ? "Tillykke"
                : state.increment > 1
                  ? "Dobbeltstempel"
                  : "Stempel modtaget"}
            </span>
            <h1 className="font-fraunces font-light italic text-[1.9rem] leading-tight text-ink">
              {state.rewardReady
                ? "Dit kort er fuldt"
                : `${cap(talDk(state.stamps))} af ${talDk(state.required)}`}
            </h1>
          </div>

          {/* Kortet er helten: kunden ser det nye stempel poppe ind. */}
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

          <p className="font-[300] text-[0.9rem] leading-relaxed text-stone">
            {state.rewardReady
              ? "Vis dit kort ved kassen og få din belønning."
              : `${state.required - state.stamps} ${
                  state.required - state.stamps === 1 ? "stempel" : "stempler"
                } tilbage til din belønning.`}
          </p>

          <ButtonLink
            href={`/kort/${state.serial}`}
            variant={state.rewardReady ? "moss" : "outline"}
            size="lg"
          >
            Se dit kort
          </ButtonLink>
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
          <ButtonLink href={`/k/${slug}`} variant="moss" size="lg">
            Hent dit kort
          </ButtonLink>
        </div>
      ) : null}

      {state.phase === "error" ? (
        <div className="flex flex-col items-center gap-5">
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
          <h1 className="font-[300] text-[1.4rem] text-ink">Prøv igen</h1>
          <p className="max-w-xs font-[300] text-[0.9rem] leading-relaxed text-stone">
            {state.message}
          </p>
          <button onClick={doStamp} className={btnClass("moss", "lg")}>
            Prøv igen
          </button>
        </div>
      ) : null}
    </main>
  );
}
