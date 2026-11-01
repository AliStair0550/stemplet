"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import {
  OFFER_TEXT_MAX,
  OFFER_TITLE_MAX,
  dkParts,
  offerEndFields,
  offerEndLabel,
  offerPushText,
  type OfferKind,
} from "@/lib/member-offers-shared";
import { createOfferAction, deleteOfferAction, setOfferActiveAction, updateOfferAction } from "./actions";

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

/** Pushbeskeden om tilbuddet, klar i Kommunikation (rettes og sendes der). */
function pushHref(kind: OfferKind, title: string, partnerName: string | null): string {
  return `/app/beskeder?tekst=${encodeURIComponent(offerPushText({ kind, title, partnerName }))}`;
}

// Opret eller ret (med `offer`). Efter oprettelse faar ejeren tilbuddet med
// tilbage, saa siden kan foreslaa at fortaelle kunderne om det.
function OfferForm({
  kind,
  offer,
  onDone,
}: {
  kind: OfferKind;
  offer?: OfferRow;
  onDone: (createdId?: string) => void;
}) {
  const [title, setTitle] = useState(offer?.title ?? "");
  const [text, setText] = useState(offer?.text ?? "");
  const [partnerName, setPartnerName] = useState(offer?.partnerName ?? "");
  const [link, setLink] = useState(offer?.link ?? "");
  const initialEnd = offerEndFields(offer?.endsAt ?? null);
  const [endsOn, setEndsOn] = useState(initialEnd.endsOn);
  const [endsTime, setEndsTime] = useState(initialEnd.endsTime);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save() {
    setError(null);
    start(async () => {
      const input = { kind, title, text, partnerName, link, endsOn, endsTime };
      if (offer) {
        const res = await updateOfferAction(offer.id, input);
        if (res.ok) onDone();
        else setError(res.error);
      } else {
        const res = await createOfferAction(input);
        if (res.ok) onDone(res.id);
        else setError(res.error);
      }
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
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="fx dinbutik.dk"
            className={field}
          />
        </label>
      </div>
      {/* Tidsbegrænset tilbud: slutter af sig selv, og kunden ser en nedtælling. */}
      <fieldset className="flex flex-col gap-1.5">
        <legend className="mb-1.5 text-[0.85rem] font-medium text-ink">Slutter (valgfrit)</legend>
        <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
          <input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
            aria-label="Sidste dag"
            className={field}
          />
          <input
            type="time"
            value={endsTime}
            onChange={(e) => {
              setEndsTime(e.target.value);
              // Klokkeslaet uden dato: i dag.
              if (e.target.value && !endsOn) setEndsOn(dkParts(new Date()).date);
            }}
            aria-label="Klokkeslæt"
            className={field}
          />
        </div>
        <span className="text-[0.8rem] leading-snug text-slate">
          {endsOn
            ? "Tilbuddet forsvinder af sig selv, og kunderne ser en nedtælling."
            : "Uden slutning vises tilbuddet, til du skjuler det. Uden klokkeslæt gælder hele dagen."}
        </span>
      </fieldset>
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
          {pending ? "Gemmer..." : offer ? "Gem ændringer" : "Gem og vis for kunderne"}
        </button>
        <button type="button" onClick={() => onDone()} disabled={pending} className="inline-flex min-h-11 items-center rounded-full border border-clay px-5 text-[0.92rem] text-ink hover:border-ink">
          Fortryd
        </button>
      </div>
    </div>
  );
}

function OfferItem({ o, kind }: { o: OfferRow; kind: OfferKind }) {
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const expired = o.active && !o.live;
  if (editing) {
    return (
      <li className="py-4 first:pt-0 last:pb-0">
        <OfferForm kind={kind} offer={o} onDone={() => setEditing(false)} />
      </li>
    );
  }
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
          {o.endsAt ? <span>{offerEndLabel(new Date(o.endsAt))}</span> : <span>Ingen slutning</span>}
        </p>
        {o.live ? (
          <Link href={pushHref(kind, o.title, o.partnerName)} className="mt-2 inline-block text-[0.82rem] font-semibold text-[#1B5EAE] underline underline-offset-4">
            Send som pushbesked
          </Link>
        ) : null}
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
              onClick={() => setEditing(true)}
              className="rounded-full border border-clay px-4 py-2 text-[0.82rem] text-ink hover:border-ink"
            >
              Ret
            </button>
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
  // Det nye tilbud slaas op i listen, saa banneret altid viser den aktuelle tekst.
  const [createdId, setCreatedId] = useState<string | null>(null);
  const created = createdId ? offers.find((o) => o.id === createdId && o.live) : undefined;
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
            onClick={() => {
              setCreatedId(null);
              setAdding(true);
            }}
            className="inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-[0.88rem] font-semibold text-white hover:bg-[#0A2D5A]"
          >
            + {c.add}
          </button>
        )}
      </div>
      {adding ? (
        <OfferForm
          kind={kind}
          onDone={(id) => {
            setAdding(false);
            setCreatedId(id ?? null);
          }}
        />
      ) : null}
      {/* Nyt tilbud: foreslaa at fortaelle kunderne det som pushbesked. */}
      {created ? (
        <div role="status" className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#E8F0FB] p-4">
          <span className="min-w-0">
            <span className="block text-[0.92rem] font-semibold text-ink">Gemt. Kunderne kan se det nu.</span>
            <span className="block text-[0.84rem] text-stone">Fortæl dem det med en pushbesked, så de ikke går glip af det.</span>
          </span>
          <span className="flex shrink-0 items-center gap-2">
            <Link
              href={pushHref(kind, created.title, created.partnerName)}
              className="inline-flex min-h-10 items-center rounded-full bg-ink px-5 text-[0.88rem] font-semibold text-white hover:bg-[#0A2D5A]"
            >
              Send som pushbesked
            </Link>
            <button type="button" onClick={() => setCreatedId(null)} className="px-2 text-[0.84rem] text-stone underline underline-offset-4 hover:text-ink">
              Ikke nu
            </button>
          </span>
        </div>
      ) : null}
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
