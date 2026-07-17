"use client";

import { useActionState } from "react";
import { findMyCard, type FindState } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export function FindCardForm() {
  const [state, action] = useActionState<FindState, FormData>(findMyCard, {});

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.7rem] font-[400] uppercase tracking-[0.12em] text-slate">
          Serienummer
        </span>
        <input
          name="serial"
          required
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Fx ABC123XYZ"
          className="border border-clay bg-parchment px-4 py-3 font-[200] uppercase tracking-[0.15em] text-[0.95rem] text-ink outline-none focus:border-terracotta"
        />
        <span className="text-[0.75rem] font-[200] leading-relaxed text-slate">
          Nummeret står under stregkoden på dit kort.
        </span>
      </label>
      {state.error ? (
        <p className="text-[0.8rem] font-[300] text-rust">{state.error}</p>
      ) : null}
      <SubmitButton variant="terracotta" size="lg" pendingText="Finder dit kort...">
        Find mit kort
      </SubmitButton>
    </form>
  );
}
