"use client";

import { useState, useTransition } from "react";
import { cn, formatDkDate } from "@/lib/utils";
import { OFFER_TEXT_MAX, OFFER_TITLE_MAX, type OfferKind } from "@/lib/member-offers";
import { createOfferAction, deleteOfferAction, setOfferActiveAction } from "./actions";

export type OfferRow = {
  id: string;
  title: string;
  text: string | null;
  partnerName: string | null;
  link: string | null;
  endsAt: string | null;
  active: boolean;
  live: boolean;
};

const COPY: Record<OfferKind, { title: string; intro: string; add: string; empty: string }> = {
  OFFER: {
    title: "Tilbud til kortholdere",
    intro: "Særlige tilbud kun for dem med kortet, fx en gratis kop til fødselaren eller 20 % på en bestemt vare.",
    add: "Nyt tilbud",
    empty: "Ingen tilbud endnu.",
  },
  PARTNER: {
    title: "Samarbejdspartnere",
    intro: "Rabatter hos andre butikker, som dine kunder får ved at vise kortet. Godt for jer begge.",
    add: "Ny partner",
    empty: "Ingen samarbejdspartnere endnu.",
  },
};

const field =
  "w-full rounded-xl border border-fog bg-[#F2F5F9] px-4 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-ink";

function NewOfferForm({ kind, onDone }: { kind: OfferKind; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [link, setLink] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const res = await createOfferAction({ kind, title, text, partnerName, link, endsOn });
      if (res.ok) onDone();
      else setError(res.error);
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-[14px] border border-fog p-4">
      {kind === "PARTNER" ? (
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-medium text-ink">Partnerens navn</span>
          <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} maxLength={60} className={field} />
        </label>
      ) : null}
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.85rem] font-medium text-ink">Overskrift</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={OFFER_TITLE_MAX} className={field} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.85rem] font-medium text-ink">Beskrivelse (valgfri)</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={OFFER_TEXT_MAX} rows={2} className={cn(field, "resize-none")} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-medium text-ink">Link (valgfrit)</span>
          <input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="https://" className={field} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[0.85rem] font-medium text-ink">Gælder til og med (valgfrit)</span>
          <input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className={field} />
        </label>
      </div>
      {error ? (
        <p role="alert" className="text-[0.85rem] text-rust">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-white hover:bg-[#0A2D5A] disabled:opacity-50"
        >
          {pending ? "Gemmer..." : "Gem og vis for kunderne"}
        </button>
        <button type="button" onClick={onDone} disabled={pending} className="inline-flex min-h-11 items-center rounded-full border border-clay px-5 text-[0.92rem] text-ink hover:border-ink">
          Fortryd
        </button>
      </div>
    </div>
  );
}

function OfferItem({ o, kind }: { o: OfferRow; kind: OfferKind }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expired = o.active && !o.live;
  return (
    <li className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {kind === "PARTNER" && o.partnerName ? <p className="text-[0.78rem] font-semibold uppercase tracking-[0.08em] text-slate">{o.partnerName}</p> : null}
        <p className="text-[1rem] font-semibold text-ink">{o.title}</p>
        {o.text ? <p className="mt-0.5 text-[0.88rem] leading-snug text-stone">{o.text}</p> : null}
        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.78rem] text-slate">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold",
              o.live ? "bg-[#E8F0FB] text-[#1B5EAE]" : "bg-[#F2F5F9] text-slate",
            )}
          >
            {o.live ? "Vises" : expired ? "Udløbet" : "Skjult"}
          </span>
          {o.endsAt ? <span>Til og med {formatDkDate(new Date(o.endsAt))}</span> : <span>Ingen slutdato</span>}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {confirmDelete ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => void (await deleteOfferAction(o.id)))}
              className="rounded-full bg-rust px-4 py-2 text-[0.82rem] font-semibold text-white disabled:opacity-50"
            >
              Ja, slet
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-full border border-clay px-4 py-2 text-[0.82rem] text-ink">
              Fortryd
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => start(async () => void (await setOfferActiveAction(o.id, !o.active)))}
              className="rounded-full border border-clay px-4 py-2 text-[0.82rem] text-ink hover:border-ink disabled:opacity-50"
            >
              {o.active ? "Skjul" : "Vis igen"}
            </button>
            <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-full px-3 py-2 text-[0.82rem] text-stone underline underline-offset-4 hover:text-ink">
              Slet
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function OffersSection({ kind, offers }: { kind: OfferKind; offers: OfferRow[] }) {
  const [adding, setAdding] = useState(false);
  const c = COPY[kind];
  return (
    <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">{c.title}</h2>
          <p className="mt-0.5 text-[0.88rem] leading-relaxed text-stone">{c.intro}</p>
        </div>
        {adding ? null : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-[0.88rem] font-semibold text-white hover:bg-[#0A2D5A]"
          >
            + {c.add}
          </button>
        )}
      </div>
      {adding ? <NewOfferForm kind={kind} onDone={() => setAdding(false)} /> : null}
      {offers.length > 0 ? (
        <ul className="mt-5 divide-y divide-fog">
          {offers.map((o) => (
            <OfferItem key={o.id} o={o} kind={kind} />
          ))}
        </ul>
      ) : adding ? null : (
        <p className="mt-4 text-[0.88rem] text-slate">{c.empty}</p>
      )}
    </section>
  );
}
