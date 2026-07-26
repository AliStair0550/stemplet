"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Variant = "full" | "compact";
type Tone = "light" | "dark";
type Status = "idle" | "sending" | "done" | "error";

// "Skriv mig op"-formular med dobbelt opt-in. To varianter: fuld (navn,
// butiksnavn, mail) og kompakt (kun mail, til footeren). Poster til
// /api/marketing/signup; ved svar vises en bekraeftelsesbesked. tone styrer
// farverne, saa den ogsaa staar rent paa footerens moerke baggrund.
export function NewsletterSignup({
  variant,
  source,
  tone = "light",
}: {
  variant: Variant;
  source: string;
  tone?: Tone;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [already, setAlready] = useState(false);

  const input = cn(
    "w-full rounded-xl border px-4 py-3 text-[0.95rem] outline-none transition-colors",
    tone === "dark"
      ? "border-parchment/20 bg-parchment/[0.06] text-parchment placeholder:text-parchment/45 focus:border-parchment/50"
      : "border-ink/12 bg-white text-ink placeholder:text-taupe-light focus:border-terracotta",
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? "").trim() || undefined,
      storeName: String(data.get("storeName") ?? "").trim() || undefined,
      email: String(data.get("email") ?? "").trim(),
      source,
    };
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/marketing/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.ok) {
        setAlready(json.already === true);
        setStatus("done");
        form.reset();
      } else {
        setStatus("error");
        setMessage(json.message || "Noget gik galt. Prøv igen.");
      }
    } catch {
      setStatus("error");
      setMessage("Kunne ikke sende. Tjek din forbindelse og prøv igen.");
    }
  }

  // Skrevet-op-tilstand: erstat formularen med en dopamin-kvittering.
  if (status === "done") {
    return <SignupCelebration tone={tone} already={already} />;
  }

  const errorClass = tone === "dark" ? "text-[#F0B7A3]" : "text-rust";

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      {variant === "full" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Dit navn"
            aria-label="Dit navn"
            className={input}
          />
          <input
            name="storeName"
            type="text"
            autoComplete="organization"
            placeholder="Butiksnavn"
            aria-label="Butiksnavn"
            className={input}
          />
        </div>
      ) : null}

      <div className={cn(variant === "compact" ? "flex flex-col gap-3 sm:flex-row" : "flex flex-col gap-3")}>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Din e-mail"
          aria-label="Din e-mail"
          className={input}
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className={cn(
            btnClass("primary", "md"),
            variant === "compact" ? "shrink-0" : "w-full",
          )}
        >
          {status === "sending" ? "Sender..." : "Skriv mig op"}
        </button>
      </div>

      {status === "error" ? (
        <p role="alert" className={cn("text-[0.85rem]", errorClass)}>
          {message}
        </p>
      ) : null}
    </form>
  );
}

// Dopamin-kvittering: en terracotta-badge med flueben, der popper ind, omgivet af
// bloede signal-pulser der breder sig udad, saa det antyder "du er paa nu og faar
// opdateringer". Ikke konfetti. Under prefers-reduced-motion neutraliseres
// animationerne globalt, saa kun badge + tekst staar tilbage.
function SignupCelebration({
  tone,
  already,
}: {
  tone: Tone;
  already: boolean;
}) {
  const heading = already ? "Du er allerede skrevet op." : "Du er skrevet op!";
  const sub = already
    ? "Tak, fordi du holder kontakten."
    : "Vi holder dig opdateret. Ingen spam, kun gode idéer.";

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 py-2 text-center"
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {!already ? (
          <>
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-terracotta/50 [animation:presencePulse_2.4s_ease-out_infinite]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-terracotta/50 [animation:presencePulse_2.4s_ease-out_infinite] [animation-delay:0.8s]"
            />
            <span
              aria-hidden
              className="absolute inset-0 rounded-full border border-terracotta/50 [animation:presencePulse_2.4s_ease-out_infinite] [animation-delay:1.6s]"
            />
          </>
        ) : null}
        <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-terracotta text-parchment shadow-[0_6px_20px_-6px_rgba(166,80,46,0.6)] [animation:stampPop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </div>
      <p
        className={cn(
          "text-[1.05rem] font-bold tracking-[-0.01em]",
          tone === "dark" ? "text-parchment" : "text-ink",
        )}
      >
        {heading}
      </p>
      <p
        className={cn(
          "max-w-xs text-[0.9rem] leading-[1.6]",
          tone === "dark" ? "text-parchment/70" : "text-stone",
        )}
      >
        {sub}
      </p>
    </div>
  );
}
