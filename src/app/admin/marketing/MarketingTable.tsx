"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import type { MarketingStatus } from "@prisma/client";
import { formatDkDate } from "@/lib/utils";
import {
  MARKETING_STATUS_LABELS,
  MARKETING_STATUSES,
} from "@/lib/marketing";
import { setMarketingStatus, setMarketingNote } from "./actions";

export type SignupRow = {
  id: string;
  name: string | null;
  storeName: string | null;
  email: string;
  source: string; // laesbar etiket
  signedUpAt: Date;
  confirmedAt: Date | null;
  status: MarketingStatus;
  note: string | null;
};

export function MarketingTable({ rows }: { rows: SignupRow[] }) {
  const [q, setQ] = useState("");

  const needle = q.trim().toLowerCase();
  const shown = rows.filter((r) => {
    if (needle) {
      const hay =
        `${r.name ?? ""} ${r.storeName ?? ""} ${r.email} ${r.source}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg navn, butik, mail eller kilde"
          className="min-w-[16rem] flex-1 rounded-md border border-fog bg-white px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-terracotta"
        />
      </div>

      <p className="text-[0.74rem] font-[300] text-slate">
        Viser {shown.length} af {rows.length}
      </p>

      <div className="overflow-x-auto rounded-lg border border-fog bg-white shadow-card">
        <table className="w-full min-w-[860px] border-collapse text-left text-[0.84rem]">
          <thead>
            <tr className="border-b border-fog text-[0.62rem] uppercase tracking-[0.1em] text-slate">
              <th className="px-4 py-3 font-[500]">Tilmeldt</th>
              <th className="px-4 py-3 font-[500]">Navn / butik</th>
              <th className="px-4 py-3 font-[500]">Mail</th>
              <th className="px-4 py-3 font-[500]">Kilde</th>
              <th className="px-4 py-3 font-[500]">Samtykke</th>
              <th className="px-4 py-3 font-[500]">Status</th>
              <th className="px-4 py-3 font-[500]">Note</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <Row key={r.id} r={r} />
            ))}
          </tbody>
        </table>
        {shown.length === 0 ? (
          <p className="px-4 py-6 font-[300] text-[0.88rem] text-slate">
            Ingen tilmeldinger matcher.
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Row({ r }: { r: SignupRow }) {
  const [noteOpen, setNoteOpen] = useState(false);

  return (
    <>
      <tr className="border-b border-fog/70 align-top">
        <td className="whitespace-nowrap px-4 py-3 font-[300] text-slate">
          {formatDkDate(r.signedUpAt)}
        </td>
        <td className="px-4 py-3">
          <span className="block font-[400] text-ink">{r.name || "-"}</span>
          {r.storeName ? (
            <span className="block font-[300] text-[0.78rem] text-slate">
              {r.storeName}
            </span>
          ) : null}
        </td>
        <td className="px-4 py-3">
          <a
            href={`mailto:${r.email}`}
            className="font-[400] text-terracotta underline-offset-2 hover:underline"
          >
            {r.email}
          </a>
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-[300] text-stone">
          {r.source}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          {r.confirmedAt ? (
            <span className="text-[0.72rem] font-[400] uppercase tracking-[0.06em] text-terracotta">
              ✓ {formatDkDate(r.confirmedAt)}
            </span>
          ) : (
            <span className="text-[0.72rem] font-[400] uppercase tracking-[0.06em] text-slate">
              Nej
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <StatusSelect id={r.id} status={r.status} />
        </td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setNoteOpen((v) => !v)}
            className="rounded-md border border-fog px-2 py-0.5 text-[0.62rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:border-clay hover:text-ink"
          >
            {r.note ? "Note ✎" : "Tilføj note"}
          </button>
        </td>
      </tr>
      {noteOpen ? (
        <tr className="border-b border-fog/70 bg-sand/40">
          <td colSpan={7} className="px-4 py-3">
            <NoteEditor id={r.id} note={r.note} onDone={() => setNoteOpen(false)} />
          </td>
        </tr>
      ) : r.note ? (
        <tr className="border-b border-fog/70">
          <td colSpan={7} className="px-4 pb-3 pt-0">
            <p className="whitespace-pre-wrap text-[0.8rem] font-[300] italic text-stone">
              {r.note}
            </p>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: MarketingStatus;
}) {
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) =>
        start(() => setMarketingStatus(id, e.target.value as MarketingStatus))
      }
      className="rounded-md border border-fog bg-white px-2.5 py-1 text-[0.74rem] font-[400] text-ink transition-colors hover:border-clay focus:border-terracotta focus:outline-none disabled:opacity-50"
      aria-label="Skift status"
    >
      {MARKETING_STATUSES.map((s) => (
        <option key={s} value={s}>
          {MARKETING_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

function NoteEditor({
  id,
  note,
  onDone,
}: {
  id: string;
  note: string | null;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(setMarketingNote, {
    error: null as string | null,
    ok: false as boolean | undefined,
  });

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={id} />
      <textarea
        name="note"
        defaultValue={note ?? ""}
        rows={2}
        placeholder="Fri note (fx hvad I aftalte, hvornår I skal følge op)"
        className="w-full rounded-md border border-fog bg-white px-3 py-2 text-[0.84rem] text-ink outline-none focus:border-terracotta"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-terracotta bg-terracotta px-3 py-1 text-[0.72rem] font-[400] text-parchment transition-colors hover:bg-terracotta-dark disabled:opacity-50"
        >
          {pending ? "Gemmer..." : "Gem note"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="rounded-md border border-fog px-2.5 py-1 text-[0.72rem] font-[400] text-slate transition-colors hover:text-ink"
        >
          Luk
        </button>
        {state.error ? (
          <span className="text-[0.72rem] text-rust">{state.error}</span>
        ) : null}
      </div>
    </form>
  );
}
