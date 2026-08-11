"use client";

import { useState } from "react";
import { unpairAction } from "./actions";

// Frakobl kassen kraever en inline bekraeftelse, saa et enkelt fejl-tryk ikke
// logger enheden ud midt i en ekspedition (og tvinger en ny parring).
export function UnpairButton() {
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-[0.68rem] font-[300] text-slate">
          Frakobl enheden?
        </span>
        <form action={unpairAction}>
          <button className="text-[0.68rem] font-[500] uppercase tracking-[0.1em] text-rust transition-opacity hover:opacity-70">
            Bekræft
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="text-[0.68rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
        >
          Fortryd
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirm(true)}
      className="text-[0.68rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-rust"
    >
      Frakobl enhed
    </button>
  );
}
