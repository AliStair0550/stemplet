"use client";

import { useState, useTransition } from "react";
import { deleteProfileAction } from "./profile-actions";

// Slet profil: kraever, at man skriver SLET. Viser hvilke butikker der
// forsvinder med (dem, hvor man er den eneste med adgang).
export function DeleteProfile({ email, deletes }: { email: string; deletes: string[] }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const res = await deleteProfileAction(confirm);
      if (res.error) setError(res.error);
    });
  }

  return (
    <div>
      <h3 className="text-[1rem] font-semibold text-ink">Slet profil</h3>
      <p className="mt-1 max-w-xl text-[0.88rem] leading-relaxed text-stone">
        Sletter din profil ({email}).{" "}
        {deletes.length > 0
          ? `${deletes.join(", ")} slettes også med alle kort, kunder og stempler, fordi du er den eneste med adgang.`
          : "Butikkerne beholdes, fordi andre også har adgang."}{" "}
        Det kan ikke fortrydes.
      </p>
      {open ? (
        <div className="mt-4 flex flex-col gap-3">
          <label className="text-[0.85rem] text-ink" htmlFor="slet-bekraeft">
            Skriv SLET for at bekræfte
          </label>
          <input
            id="slet-bekraeft"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="off"
            className="w-full max-w-xs rounded-xl border border-fog bg-[#F2F5F9] px-4 py-2.5 text-[0.95rem] text-ink outline-none focus:border-ink"
          />
          {error ? (
            <p role="alert" className="text-[0.85rem] text-rust">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending || confirm.trim().toUpperCase() !== "SLET"}
              className="inline-flex min-h-11 items-center rounded-full bg-rust px-6 text-[0.92rem] font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Sletter..." : "Slet min profil"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirm("");
                setError(null);
              }}
              disabled={pending}
              className="inline-flex min-h-11 items-center rounded-full border border-clay px-5 text-[0.92rem] text-ink hover:border-ink"
            >
              Fortryd
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex min-h-11 items-center rounded-full border border-rust px-5 text-[0.92rem] font-semibold text-rust hover:bg-rust/5"
        >
          Slet profil
        </button>
      )}
    </div>
  );
}
