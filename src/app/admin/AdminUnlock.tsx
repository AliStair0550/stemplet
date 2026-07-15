"use client";

import { useActionState } from "react";
import { unlockAdmin } from "./actions";

// Kode-laasen: vist naar du er logget ind som superadmin, men ikke har laast op
// med koden endnu. Koden kendes kun af dig (ADMIN_ACCESS_CODE), saa en kompromit-
// teret indbakke alene ikke giver adgang til admin.
export function AdminUnlock() {
  const [state, formAction, pending] = useActionState(unlockAdmin, {
    error: null as string | null,
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-6">
      <form
        action={formAction}
        className="w-full max-w-sm rounded-2xl border border-fog bg-white p-8 shadow-card"
      >
        <h1 className="font-[300] text-[1.3rem] tracking-[0.02em] text-ink">
          Admin-adgang
        </h1>
        <p className="mt-2 font-[300] text-[0.85rem] leading-relaxed text-slate">
          Indtast admin-koden for at fortsætte. Kun du kender den.
        </p>
        <input
          type="password"
          name="code"
          autoFocus
          autoComplete="off"
          placeholder="Admin-kode"
          className="mt-5 w-full rounded-lg border border-fog bg-parchment px-4 py-3 font-[300] text-[0.95rem] text-ink outline-none transition-colors focus:border-moss"
        />
        {state.error ? (
          <p className="mt-2 font-[300] text-[0.8rem] text-rust">{state.error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 w-full rounded-full bg-ink px-5 py-3 text-[0.78rem] font-[400] uppercase tracking-[0.08em] text-parchment transition-colors hover:bg-stone disabled:opacity-50"
        >
          {pending ? "Låser op..." : "Lås op"}
        </button>
      </form>
    </main>
  );
}
