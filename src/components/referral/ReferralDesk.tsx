"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { redeemLabel, redeemReceipt, rewardPhrase } from "@/lib/referral-text";
import type { DeskCustomer, DeskHit } from "@/lib/referral-desk";
import { CelebrationToast } from "@/components/Celebrate";

// Kassens henvisningsvisning (fase 3, docs/henvisninger.md "Kassen"): een
// soegelinje, scan-knap og et resultatkort med de to handlinger som store
// knapper nederst. Bekraeftelse med een linje, ingen modal. Alt gaar gennem
// /api/henvisninger/kasse/* (tilstandsmaskinen), aldrig gennem stempel-ruterne.

// Stemplets egen kamera-scanner, genbrugt uaendret og loadet foerst ved brug.
const Scanner = dynamic(
  () => import("@/components/Scanner").then((m) => ({ default: m.Scanner })),
  { ssr: false },
);

function newIdemKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

type ApiResult = { ok: boolean; code?: string; message?: string } & Record<string, unknown>;

async function api(path: string, body?: unknown): Promise<ApiResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(path, {
      method: body ? "POST" : "GET",
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: ctrl.signal,
    });
    return ((await res.json().catch(() => null)) as ApiResult) ?? {
      ok: false,
      message: "Noget gik galt. Prøv igen.",
    };
  } catch {
    return { ok: false, message: "Ingen forbindelse. Prøv igen." };
  } finally {
    clearTimeout(t);
  }
}

const BASE = "/api/henvisninger/kasse";

function formatPhone(p: string | null): string | null {
  if (!p) return null;
  const m = /^\+45(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(p);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

export function ReferralDesk({ hasPin, initialSerial = null }: { hasPin: boolean; initialSerial?: string | null }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<DeskHit[]>([]);
  const [scanning, setScanning] = useState(false);
  const [customer, setCustomer] = useState<DeskCustomer | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Fejringen efter "Rabat givet" og indloesning (een sætning om, hvad der skete).
  const [toast, setToast] = useState<{ title: string; text?: string } | null>(null);

  // Soegning med en kort pause, saa der ikke fyres et kald pr. tastetryk.
  useEffect(() => {
    if (customer) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await api(`${BASE}/sog?q=${encodeURIComponent(q)}`);
      setHits(res.ok ? ((res.hits as DeskHit[]) ?? []) : []);
    }, 220);
    return () => clearTimeout(t);
  }, [query, customer]);

  const open = useCallback(async (by: { id: string } | { serial: string }) => {
    const qs = "id" in by ? `id=${encodeURIComponent(by.id)}` : `serial=${encodeURIComponent(by.serial)}`;
    const res = await api(`${BASE}/kunde?${qs}`);
    if (res.ok) {
      setCustomer(res.customer as DeskCustomer);
      setHits([]);
    } else {
      setNote({ ok: false, text: res.message ?? "Kunden blev ikke fundet." });
    }
  }, []);

  // Aabnet med en bestemt kunde (fra Kunder eller Hjem: ?kort=).
  useEffect(() => {
    if (initialSerial) void open({ serial: initialSerial });
  }, [initialSerial, open]);

  function reset() {
    setCustomer(null);
    setQuery("");
    setHits([]);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {toast ? <CelebrationToast title={toast.title} text={toast.text} onDone={() => setToast(null)} /> : null}
      {customer ? (
        <CustomerCard
          customer={customer}
          hasPin={hasPin}
          note={note}
          onNote={setNote}
          onCelebrate={setToast}
          onReload={() => open({ id: customer.id })}
          onDone={reset}
        />
      ) : (
        <>
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setNote(null);
              }}
              placeholder="Navn, e-mail eller kode"
              aria-label="Søg kunde"
              autoComplete="off"
              className="min-h-[3.25rem] flex-1 rounded-full border border-clay bg-white px-5 text-[1rem] text-ink outline-none focus:border-terracotta"
            />
            <button
              type="button"
              onClick={() => setScanning(true)}
              className={btnClass("outline", "lg")}
            >
              Scan
            </button>
          </div>
          {hits.length > 0 ? (
            <ul className="overflow-hidden rounded-lg border border-fog bg-white shadow-card">
              {hits.map((h) => (
                <li key={h.id} className="border-b border-fog last:border-b-0">
                  <button
                    type="button"
                    onClick={() => open({ id: h.id })}
                    className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-sand/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[0.95rem] text-ink">{h.name ?? "Uden navn"}</span>
                      <span className="block truncate text-[0.78rem] text-stone">{h.email ?? formatPhone(h.phone)}</span>
                    </span>
                    <span className="shrink-0 text-[0.8rem] tracking-[0.04em] text-slate">{h.code}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim().length >= 2 ? (
            <p className="px-2 text-[0.85rem] text-stone">Ingen kunder fundet.</p>
          ) : null}
        </>
      )}

      {/* Med en kunde aaben vises bekraeftelsen ved knapperne (CustomerCard). */}
      {note && !customer ? <NoteLine note={note} /> : null}

      {scanning ? (
        <Scanner
          hint="Ret kameraet mod QR-koden på kundens kort."
          onClose={() => setScanning(false)}
          onResult={(text) => {
            // Samme tolkning som Stemplets kasse: et kort-link eller selve serial.
            const serial = text.includes("/kort/")
              ? (text.split("/kort/")[1]?.split(/[/?#]/)[0] ?? text)
              : text.trim();
            setScanning(false);
            void open({ serial });
          }}
        />
      ) : null}
    </div>
  );
}

function NoteLine({ note }: { note: { ok: boolean; text: string } }) {
  return (
    <p
      role="status"
      className={cn("px-2 text-center text-[0.9rem]", note.ok ? "text-ink" : "text-rust")}
    >
      {note.text}
    </p>
  );
}

function CustomerCard({
  customer,
  hasPin,
  note,
  onNote,
  onCelebrate,
  onReload,
  onDone,
}: {
  customer: DeskCustomer;
  hasPin: boolean;
  note: { ok: boolean; text: string } | null;
  onNote: (n: { ok: boolean; text: string } | null) => void;
  onCelebrate: (t: { title: string; text?: string }) => void;
  onReload: () => Promise<void>;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState<"visit" | "redeem" | null>(null);
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(hasPin);
  // Samme noegle ved et nyt tryk paa samme handling (retry efter tabt svar), ny
  // noegle naar handlingen er afsluttet. Saa giver et dobbelttryk eet resultat.
  const visitKey = useRef(newIdemKey());
  const redeemKey = useRef(newIdemKey());

  const ref = customer.openReferral;
  const reward = customer.rewards[0] ?? null;

  async function visit() {
    if (!ref || busy) return;
    setBusy("visit");
    onNote(null);
    // "Rabat givet": registrerer besoeget og indloeser vennens rabat i eet tryk.
    const res = await api(`${BASE}/besoeg`, {
      referralId: ref.id,
      idempotencyKey: visitKey.current,
      pin: pin || undefined,
    });
    setBusy(null);
    if (res.ok) {
      visitKey.current = newIdemKey();
      setPin("");
      const amb = (res.rewards as { role: string; type: "AMOUNT" | "PERCENT" | "STAMPS" | "SERVICE"; value: string }[]).find(
        (r) => r.role === "referrer",
      );
      onCelebrate({
        title: `${customer.name ?? "Kunden"} har fået sin rabat`,
        text: amb
          ? `${ref.referrerName ?? "Ambassadøren"} har nu ${rewardPhrase(amb.type, amb.value)} til gode.`
          : `${ref.referrerName ?? "Ambassadøren"} har nået månedens loft, så der er ingen ny belønning.`,
      });
      await onReload();
    } else {
      if (res.code === "PIN") setNeedPin(true);
      onNote({ ok: false, text: res.message ?? "Noget gik galt. Prøv igen." });
    }
  }

  async function redeem() {
    if (!reward || busy) return;
    setBusy("redeem");
    onNote(null);
    const res = await api(`${BASE}/indloes`, {
      rewardId: reward.id,
      idempotencyKey: redeemKey.current,
      pin: pin || undefined,
    });
    setBusy(null);
    if (res.ok) {
      redeemKey.current = newIdemKey();
      setPin("");
      onCelebrate(redeemReceipt(reward.type, reward.value, customer.name));
      await onReload();
    } else {
      if (res.code === "PIN") setNeedPin(true);
      onNote({ ok: false, text: res.message ?? "Noget gik galt. Prøv igen." });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[1.15rem] text-ink">{customer.name ?? "Uden navn"}</p>
            <p className="truncate text-[0.82rem] text-stone">{customer.email ?? formatPhone(customer.phone)}</p>
          </div>
          {customer.code ? (
            <span className="shrink-0 rounded-full bg-sand px-3 py-1 text-[0.8rem] tracking-[0.04em] text-ink">
              {customer.code}
            </span>
          ) : null}
        </div>

        <dl className="mt-4 flex flex-col gap-2 border-t border-fog pt-4 text-[0.88rem]">
          {ref ? (
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-stone">Henvist af</dt>
              <dd className={cn("text-right", ref.stale ? "text-rust" : "text-ink")}>
                {ref.referrerName ?? ref.referrerCode}
                {ref.stale ? ", udløbet" : ", venter på første besøg"}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-stone">Til gode</dt>
            <dd className="text-right text-ink">
              {customer.rewards.length === 0
                ? "Ingen belønninger"
                : customer.rewards.map((r) => rewardPhrase(r.type, r.value)).join(", ")}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-stone">Venner henvist</dt>
            <dd className="text-ink">{customer.referralsDone}</dd>
          </div>
        </dl>

        {customer.canLink ? <LinkReferrer customer={customer} onNote={onNote} onLinked={onReload} /> : null}
      </div>

      {(reward || ref) && needPin ? (
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="Personale-PIN"
          aria-label="Personale-PIN"
          className="min-h-[3rem] rounded-full border border-clay bg-white px-5 text-center text-[1rem] tracking-[0.3em] text-ink outline-none focus:border-terracotta"
        />
      ) : null}

      {note ? <NoteLine note={note} /> : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={visit}
          disabled={!ref || ref.stale || busy !== null}
          className={btnClass("primary", "lg")}
        >
          {busy === "visit" ? "Et øjeblik" : "Rabat givet"}
        </button>
        <button
          type="button"
          onClick={redeem}
          disabled={!reward || busy !== null}
          className={btnClass("ink", "lg")}
        >
          {busy === "redeem"
            ? "Et øjeblik"
            : reward
              ? reward.type === "STAMPS"
                ? redeemLabel(reward.type, reward.value)
                : `Belønning indløst: ${rewardPhrase(reward.type, reward.value)}`
              : "Belønning indløst"}
        </button>
        <button type="button" onClick={onDone} className={btnClass("ghost")}>
          Næste kunde
        </button>
      </div>
    </div>
  );
}

// "Henvist af" ved disken: find henviseren paa navn, mobil eller kode og kobl.
function LinkReferrer({
  customer,
  onNote,
  onLinked,
}: {
  customer: DeskCustomer;
  onNote: (n: { ok: boolean; text: string } | null) => void;
  onLinked: () => Promise<void>;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<DeskHit[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await api(`${BASE}/sog?q=${encodeURIComponent(q.trim())}`);
      const list = res.ok ? ((res.hits as DeskHit[]) ?? []) : [];
      setHits(list.filter((h) => h.id !== customer.id));
    }, 220);
    return () => clearTimeout(t);
  }, [q, customer.id]);

  async function link(referrer: DeskHit) {
    const res = await api(`${BASE}/kobl`, {
      referredCardId: customer.id,
      referrerCardId: referrer.id,
    });
    if (res.ok) {
      onNote({ ok: true, text: `Koblet til ${referrer.name ?? referrer.code}.` });
      setQ("");
      await onLinked();
    } else {
      onNote({ ok: false, text: res.message ?? "Kunne ikke koble." });
    }
  }

  return (
    <div className="mt-4 border-t border-fog pt-4">
      <label className="text-[0.78rem] uppercase tracking-[0.12em] text-slate" htmlFor="henvist-af">
        Henvist af
      </label>
      <input
        id="henvist-af"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Vennens navn, e-mail eller kode"
        autoComplete="off"
        className="mt-2 min-h-[2.75rem] w-full rounded-full border border-clay bg-parchment px-4 text-[0.95rem] text-ink outline-none focus:border-terracotta"
      />
      {hits.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onClick={() => link(h)}
                className="flex w-full justify-between rounded-md px-3 py-2 text-left text-[0.88rem] hover:bg-sand/50"
              >
                <span className="text-ink">{h.name ?? "Uden navn"}</span>
                <span className="text-slate">{h.code}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
