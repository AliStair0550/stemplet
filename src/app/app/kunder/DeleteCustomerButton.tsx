"use client";

import { useState, useTransition } from "react";
import { deleteCustomerAction } from "./actions";

// "Slet" paa en kortholder: spoerger foerst, fordi det ikke kan fortrydes.
export function DeleteCustomerButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    if (!window.confirm(`Slet ${name}? Kortet, stemplerne og alle oplysninger om kunden slettes. Det kan ikke fortrydes.`)) return;
    setError(null);
    start(async () => {
      const res = await deleteCustomerAction(id);
      if (!res.ok) setError(res.error ?? "Kunne ikke slette kunden.");
    });
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="rounded-full px-2.5 py-1 text-[0.74rem] text-stone transition-colors hover:bg-sand hover:text-ink disabled:opacity-50"
      >
        {pending ? "Sletter..." : "Slet"}
      </button>
      {error ? (
        <span role="alert" className="text-[0.74rem] text-rust">
          {error}
        </span>
      ) : null}
    </span>
  );
}
