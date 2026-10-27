"use client";

import { useActionState } from "react";
import { createBusinessForCustomer, type CreateForCustomerState } from "./actions";

// Opret en butik for en kunde (service). Kunden faar sin login-mail, og du lander
// i butikkens dashboard i support-tilstand og saetter resten op.
export function AdminCreateBusiness() {
  const [state, action, pending] = useActionState<CreateForCustomerState, FormData>(createBusinessForCustomer, {});
  const field = "min-h-11 rounded-lg border border-clay bg-white px-3 text-[0.9rem] text-ink outline-none focus:border-ink";
  return (
    <form action={action} className="rounded-lg border border-fog bg-white p-5 shadow-card">
      <p className="text-[0.95rem] font-[500] text-ink">Opret butik for kunde</p>
      <p className="mt-0.5 text-[0.82rem] text-stone">
        Kunden får en login-mail, og du åbner butikken i support-tilstand for at sætte den op.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
        <input name="name" placeholder="Butikkens navn" required className={field} />
        <input name="email" type="email" placeholder="kunde@mail.dk" required className={field} />
        <select name="product" defaultValue="stemplet" className={field} aria-label="Produkt">
          <option value="stemplet">Stemplet</option>
          <option value="henvisninger">Henvisninger</option>
          <option value="begge">Begge</option>
        </select>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-ink px-5 text-[0.88rem] font-[500] text-parchment hover:bg-black disabled:opacity-60"
        >
          {pending ? "Opretter" : "Opret og åbn"}
        </button>
      </div>
      {state.error ? <p className="mt-3 text-[0.85rem] text-rust">{state.error}</p> : null}
    </form>
  );
}
