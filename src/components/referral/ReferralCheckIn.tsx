"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { firstName, redeemReceipt, rewardPhrase } from "@/lib/referral-text";
import type { DeskCustomer } from "@/lib/referral-desk";

// Henvisningen ved kassen, samlet med stempelkortet efter et scan (eller fra
// Kunder): viser KUN det, der kraever handling, i den raekkefoelge personalet
// moeder det: vennens foerste besoeg (giv rabatten) og beloenninger, der er
// klar til at blive indloest. Intet at goere = intet vises. Bruger de samme
// kasse-ruter som Henvisninger (/api/henvisninger/kasse/*).

const BASE = "/api/henvisninger/kasse";

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
    return ((await res.json().catch(() => null)) as ApiResult) ?? { ok: false, message: "Noget gik galt. Prøv igen." };
  } catch {
    return { ok: false, message: "Ingen forbindelse. Prøv igen." };
  } finally {
    clearTimeout(t);
  }
}

// Kassen henter kortet og henvisningsoplysningerne samtidig: StaffCard starter
// denne hentning, saa snart kortet er scannet, og ReferralCheckIn bruger svaret,
// naar den vises (foer: foerst efter kortet var hentet, to rundture i traek).
const prefetched = new Map<string, Promise<ApiResult>>();

export function prefetchDeskCustomer(serial: string): void {
  // Altid en frisk hentning pr. scanning (aldrig et gammelt svar fra sidst).
  prefetched.set(serial, api(`${BASE}/kunde?serial=${encodeURIComponent(serial)}`));
}

export function ReferralCheckIn({ serial, hasPin }: { serial: string; hasPin: boolean }) {
  const [customer, setCustomer] = useState<DeskCustomer | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  // Kvitteringer bliver staaende (ogsaa naar der ikke er mere at goere), saa
  // personalet kan se, hvad der lige er givet. En toast forsvandt med boksen.
  const [receipts, setReceipts] = useState<{ title: string; text: string }[]>([]);
  const keys = useRef<Record<string, string>>({});
  const keyFor = (k: string) => (keys.current[k] ??= newIdemKey());

  const load = useCallback(async () => {
    // Foerste gang: den hentning, StaffCard allerede har startet. Senere (efter
    // en handling): en frisk hentning.
    const early = prefetched.get(serial);
    prefetched.delete(serial);
    const res = await (early ?? api(`${BASE}/kunde?serial=${encodeURIComponent(serial)}`));
    setCustomer(res.ok ? (res.customer as DeskCustomer) : null);
  }, [serial]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!customer) return null;
  const ref = customer.openReferral && !customer.openReferral.stale ? customer.openReferral : null;
  if (!ref && customer.rewards.length === 0 && receipts.length === 0) return null;
  const name = firstName(customer.name);

  async function visit() {
    if (!ref || busy) return;
    setBusy("visit");
    setNote(null);
    const res = await api(`${BASE}/besoeg`, { referralId: ref.id, idempotencyKey: keyFor("visit"), pin: pin || undefined });
    setBusy(null);
    if (res.ok) {
      delete keys.current.visit;
      setPin("");
      const amb = (res.rewards as { role: string; type: "AMOUNT" | "PERCENT" | "STAMPS" | "SERVICE"; value: string }[]).find(
        (r) => r.role === "referrer",
      );
      const referrer = firstName(ref.referrerName) ?? "Vennen";
      setReceipts((rs) => [
        ...rs,
        {
          title: `${name ?? "Kunden"} har fået ${ref.friendReward ?? "rabatten"}`,
          text: amb
            ? `${referrer} har nu ${rewardPhrase(amb.type, amb.value)} til gode.`
            : `${referrer} har nået månedens loft, så der er ingen ny belønning.`,
        },
      ]);
      await load();
    } else {
      setNote({ ok: false, text: res.message ?? "Noget gik galt. Prøv igen." });
    }
  }

  async function redeem(r: DeskCustomer["rewards"][number]) {
    if (busy) return;
    setBusy(r.id);
    setNote(null);
    const res = await api(`${BASE}/indloes`, { rewardId: r.id, idempotencyKey: keyFor(r.id), pin: pin || undefined });
    setBusy(null);
    if (res.ok) {
      delete keys.current[r.id];
      setPin("");
      setReceipts((rs) => [...rs, redeemReceipt(r.type, r.value, name)]);
      await load();
    } else {
      setNote({ ok: false, text: res.message ?? "Noget gik galt. Prøv igen." });
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {receipts.map((r, i) => (
        <div key={i} role="status" className="flex items-start gap-3 rounded-lg bg-[#E8F0FB] p-4" style={{ animation: "fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#061C3D] text-white">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[1rem] font-semibold leading-snug text-ink">{r.title}</span>
            <span className="mt-0.5 block text-[0.88rem] leading-snug text-stone">{r.text}</span>
          </span>
        </div>
      ))}

      {/* PIN foer knapperne, den laaser op. */}
      {hasPin ? (
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          inputMode="numeric"
          placeholder="Personale-PIN"
          aria-label="Personale-PIN"
          className="min-h-[3rem] rounded-full border border-clay bg-white px-5 text-center text-[1rem] tracking-[0.3em] text-ink outline-none focus:border-ink"
        />
      ) : null}

      {ref ? (
        <div className="flex flex-col gap-3 rounded-lg border border-ink bg-white p-5 shadow-card">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate">Ny kunde via en ven</p>
            <p className="mt-1 text-[1.2rem] font-bold leading-tight text-ink">
              {ref.friendReward
                ? `Giv ${firstName(customer.name) ?? "kunden"} ${ref.friendReward} i rabat`
                : `Giv ${firstName(customer.name) ?? "kunden"} rabatten`}
            </p>
            <p className="mt-1 text-[0.88rem] text-stone">
              Henvist af {firstName(ref.referrerName) ?? ref.referrerCode ?? "en ven"}. Når du trykker, får {firstName(ref.referrerName) ?? "vennen"} sin belønning.
            </p>
          </div>
          <button
            type="button"
            onClick={visit}
            disabled={busy !== null || (hasPin && pin.length < 4)}
            aria-busy={busy === "visit"}
            className={btnClass("primary", "lg")}
          >
            {busy === "visit" ? "Et øjeblik" : `${name ?? "Kunden"} har fået rabatten`}
          </button>
        </div>
      ) : null}

      {/* Samme moenster som vennens rabat: hvad du skal give, og en knap der
          siger, at det er sket. */}
      {customer.rewards.map((r) => {
        const phrase = rewardPhrase(r.type, r.value);
        return (
          <div key={r.id} className="flex flex-col gap-3 rounded-lg border border-ink bg-white p-5 shadow-card">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate">Til gode fra henvisning</p>
              <p className="mt-1 text-[1.2rem] font-bold leading-tight text-ink">Giv {name ?? "kunden"} {phrase}</p>
            </div>
            <button
              type="button"
              onClick={() => redeem(r)}
              disabled={busy !== null || (hasPin && pin.length < 4)}
              aria-busy={busy === r.id}
              className={btnClass("primary", "lg")}
            >
              {busy === r.id ? "Et øjeblik" : r.type === "STAMPS" ? `Giv ${phrase}` : `${name ?? "Kunden"} har fået ${phrase}`}
            </button>
          </div>
        );
      })}

      {note ? (
        <p role="status" className={cn("text-center text-[0.9rem]", note.ok ? "text-ink" : "text-rust")}>
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
