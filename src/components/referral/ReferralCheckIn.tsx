"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import { firstName, redeemReceipt, rewardPhrase } from "@/lib/referral-text";
import type { DeskCustomer } from "@/lib/referral-desk";
import { CelebrationToast } from "@/components/Celebrate";

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

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
  const [toast, setToast] = useState<{ title: string; text?: string } | null>(null);
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
  if (!ref && customer.rewards.length === 0) return null;

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
      setToast({
        title: `${customer?.name ?? "Kunden"} har fået sin rabat`,
        text: amb
          ? `${ref.referrerName ?? "Vennen"} har nu ${rewardPhrase(amb.type, amb.value)} til gode.`
          : `${ref.referrerName ?? "Vennen"} har nået månedens loft, så der er ingen ny belønning.`,
      });
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
      setToast(redeemReceipt(r.type, r.value, customer?.name));
      await load();
    } else {
      setNote({ ok: false, text: res.message ?? "Noget gik galt. Prøv igen." });
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {toast ? <CelebrationToast title={toast.title} text={toast.text} onDone={() => setToast(null)} /> : null}

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
            {busy === "visit" ? "Et øjeblik" : `${firstName(customer.name) ?? "Kunden"} har fået rabatten`}
          </button>
        </div>
      ) : null}

      {customer.rewards.map((r) => (
        <div key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-ink bg-white p-4 shadow-card">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.12em] text-slate">Til gode fra henvisning</p>
            <p className="text-[1.05rem] font-semibold text-ink">{cap(rewardPhrase(r.type, r.value))}</p>
          </div>
          <button
            type="button"
            onClick={() => redeem(r)}
            disabled={busy !== null || (hasPin && pin.length < 4)}
            aria-busy={busy === r.id}
            className={cn(btnClass("primary"), "shrink-0")}
          >
            {busy === r.id ? "Et øjeblik" : r.type === "STAMPS" ? "Giv" : "Indløs"}
          </button>
        </div>
      ))}

      {note ? (
        <p role="status" className={cn("text-center text-[0.9rem]", note.ok ? "text-ink" : "text-rust")}>
          {note.text}
        </p>
      ) : null}
    </div>
  );
}
