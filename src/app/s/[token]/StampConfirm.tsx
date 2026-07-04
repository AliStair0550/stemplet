"use client";

import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui";

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
}: {
  token: string;
  slug: string;
  businessName: string;
}) {
  const [state, setState] = useState<State>({ phase: "loading" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        const res = await fetch("/api/stamp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (data.ok) {
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
        setState({
          phase: "error",
          message: "Ingen forbindelse. Proev igen.",
        });
      }
    })();
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-parchment px-6 text-center">
      {state.phase === "loading" ? (
        <>
          <div className="h-20 w-20 animate-pulse rounded-full bg-moss/15" />
          <p className="font-[200] text-[0.9rem] text-stone">Stempler...</p>
        </>
      ) : null}

      {state.phase === "done" ? (
        <>
          <div className="animate-stamp-pop flex h-24 w-24 items-center justify-center rounded-full bg-moss text-parchment">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-11 w-11"
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </div>
          {state.rewardReady ? (
            <div className="flex flex-col gap-1">
              <h1 className="font-fraunces font-light italic text-[1.8rem] text-ink">
                Dit kort er fuldt
              </h1>
              <p className="font-[200] text-[0.9rem] text-stone">
                Vis dit kort ved kassen og faa din beloenning.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <h1 className="font-[300] text-[1.6rem] text-ink">
                Stempel {state.stamps} af {state.required}
              </h1>
              <p className="font-[200] text-[0.9rem] text-stone">
                {state.increment > 1
                  ? `Dobbeltstempel hos ${businessName}.`
                  : `Tak for besoeget hos ${businessName}.`}
              </p>
            </div>
          )}
          <ButtonLink href={`/kort/${state.serial}`} variant="moss" size="lg">
            Se dit kort
          </ButtonLink>
        </>
      ) : null}

      {state.phase === "needCard" ? (
        <>
          <h1 className="font-[300] text-[1.4rem] text-ink">
            Hent dit stempelkort foerst
          </h1>
          <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
            Du mangler et kort hos {businessName}. Det tager fem sekunder.
          </p>
          <ButtonLink href={`/k/${slug}`} variant="moss" size="lg">
            Hent dit kort
          </ButtonLink>
        </>
      ) : null}

      {state.phase === "error" ? (
        <>
          <h1 className="font-[300] text-[1.4rem] text-ink">Prøv igen</h1>
          <p className="max-w-xs font-[200] text-[0.9rem] leading-relaxed text-stone">
            {state.message}
          </p>
        </>
      ) : null}
    </main>
  );
}
