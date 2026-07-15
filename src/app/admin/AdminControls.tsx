"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { Plan } from "@prisma/client";
import {
  setPlan,
  deleteBusiness,
  clearDemoCards,
  resetStamps,
  updateOwner,
  lockAdmin,
} from "./actions";

// ── Kopiér ejer-email (til at skrive til dem) ──────────────────────────
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="inline-flex items-center gap-2">
      <a
        href={`mailto:${email}`}
        className="font-[400] text-moss underline underline-offset-2 transition-colors hover:text-moss-light"
      >
        {email}
      </a>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } catch {
            // clipboard kan vaere blokeret
          }
        }}
        className="rounded-md border border-fog px-2 py-0.5 text-[0.62rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:border-clay hover:text-ink"
      >
        {copied ? "Kopieret" : "Kopiér"}
      </button>
    </span>
  );
}

// ── Skift plan (FREE/PRO) ──────────────────────────────────────────────
export function PlanSelect({
  businessId,
  plan,
}: {
  businessId: string;
  plan: Plan;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={plan}
      disabled={pending}
      onChange={(e) =>
        start(() => setPlan(businessId, e.target.value as Plan))
      }
      className="rounded-md border border-fog bg-white px-2.5 py-1 text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-ink transition-colors hover:border-clay focus:border-moss focus:outline-none disabled:opacity-50"
      aria-label="Skift plan"
    >
      <option value="FREE">FREE</option>
      <option value="PRO">PRO</option>
    </select>
  );
}

// ── Slet butik (destruktivt, to-trins bekraeftelse) ────────────────────
export function DeleteButton({
  businessId,
  name,
}: {
  businessId: string;
  name: string;
}) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-md border border-fog px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-rust/80 transition-colors hover:border-rust/40 hover:text-rust"
      >
        Slet
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => deleteBusiness(businessId))}
        className="rounded-md border border-rust bg-rust px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-white transition-colors hover:bg-rust/90 disabled:opacity-50"
      >
        {pending ? "Sletter..." : `Bekræft: slet ${name}`}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={pending}
        className="rounded-md border border-fog px-2 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink"
      >
        Fortryd
      </button>
    </span>
  );
}

// ── Nulstil en butiks stempler (destruktivt, to-trins bekraeftelse) ────
export function ResetStampsButton({ businessId }: { businessId: string }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="rounded-md border border-fog px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:border-clay hover:text-ink"
      >
        Nulstil stempler
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await resetStamps(businessId);
            setArmed(false);
          })
        }
        className="rounded-md border border-rust bg-rust px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-white transition-colors hover:bg-rust/90 disabled:opacity-50"
      >
        {pending ? "Nulstiller..." : "Bekræft: nulstil alle stempler"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={pending}
        className="rounded-md border border-fog px-2 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink"
      >
        Fortryd
      </button>
    </span>
  );
}

// ── Redigér ejer (navn + email) ────────────────────────────────────────
export function EditOwner({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateOwner, {
    error: null as string | null,
    ok: false as boolean | undefined,
  });

  // Luk editoren, naar gemningen lykkedes.
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-fog px-2 py-0.5 text-[0.62rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:border-clay hover:text-ink"
      >
        Redigér
      </button>
    );
  }
  return (
    <form
      action={formAction}
      className="mt-1 flex flex-wrap items-center gap-2"
    >
      <input type="hidden" name="userId" value={userId} />
      <input
        name="name"
        defaultValue={name ?? ""}
        placeholder="Navn"
        className="w-28 rounded-md border border-fog bg-white px-2 py-1 text-[0.8rem] text-ink outline-none focus:border-moss"
      />
      <input
        name="email"
        type="email"
        defaultValue={email}
        placeholder="Email"
        className="w-52 rounded-md border border-fog bg-white px-2 py-1 text-[0.8rem] text-ink outline-none focus:border-moss"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-moss bg-moss px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-parchment transition-colors hover:bg-moss-light disabled:opacity-50"
      >
        {pending ? "Gemmer..." : "Gem"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        disabled={pending}
        className="rounded-md border border-fog px-2 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink"
      >
        Fortryd
      </button>
      {state.error ? (
        <span className="w-full text-[0.72rem] text-rust">{state.error}</span>
      ) : null}
    </form>
  );
}

// ── Laas admin igen ────────────────────────────────────────────────────
export function LockButton() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => lockAdmin())}
      className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink disabled:opacity-50"
    >
      {pending ? "Låser..." : "Lås admin"}
    </button>
  );
}

// ── Nulstil demo-kort (destruktivt, to-trins bekraeftelse) ─────────────
export function ClearDemoButton({ count }: { count: number }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        disabled={count === 0}
        className="rounded-md border border-fog px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:border-clay hover:text-ink disabled:opacity-40"
      >
        Nulstil demo-kort ({count})
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await clearDemoCards();
            setArmed(false);
          })
        }
        className="rounded-md border border-rust bg-rust px-2.5 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-white transition-colors hover:bg-rust/90 disabled:opacity-50"
      >
        {pending ? "Nulstiller..." : `Bekræft: slet ${count} demo-kort`}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        disabled={pending}
        className="rounded-md border border-fog px-2 py-1 text-[0.68rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink"
      >
        Fortryd
      </button>
    </span>
  );
}
