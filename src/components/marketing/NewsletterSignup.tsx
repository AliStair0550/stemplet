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
        setStatus("done");
        setMessage(
          json.already
            ? "Du er allerede skrevet op. Tak."
            : "Tjek din mail, og bekræft din tilmelding.",
        );
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

  // Bekraeftelses-tilstand: erstat formularen med en venlig kvittering.
  if (status === "done") {
    return (
      <p
        role="status"
        className={cn(
          "flex items-center justify-center gap-2 text-[0.95rem] font-medium",
          tone === "dark" ? "text-parchment" : "text-ink",
        )}
      >
        <span aria-hidden className="text-terracotta">
          ✓
        </span>
        {message}
      </p>
    );
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
