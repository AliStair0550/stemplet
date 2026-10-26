"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReferralStatus } from "@prisma/client";
import { Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { cn, relativeDk } from "@/lib/utils";
import { rewardPhrase } from "@/lib/referral-text";
import type { ReferralRow } from "@/lib/referral-desk";

// Listen over nyeste henvisninger med "Gennemført" og "Indløst" direkte i
// raekken (dokumentet: ikke bag en menu). Knapperne kalder de samme ruter som
// kassen, saa tilstandsmaskinen, laasene og PIN-reglen er de samme.

const STATUS: Record<ReferralStatus, string> = {
  CREATED: "Åben",
  VISITED: "Besøgt",
  REWARDED: "Gennemført",
  EXPIRED: "Udløbet",
  VOIDED: "Annulleret",
};

function newIdemKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function ReferralList({ rows, hasPin }: { rows: ReferralRow[]; hasPin: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [pin, setPin] = useState("");
  const [needPin, setNeedPin] = useState(false);
  // Een noegle pr. handling, genbrugt ved retry, saa et dobbelttryk = eet resultat.
  const keys = useRef(new Map<string, string>());
  const keyFor = (id: string) => {
    if (!keys.current.has(id)) keys.current.set(id, newIdemKey());
    return keys.current.get(id)!;
  };

  async function call(id: string, path: string, body: Record<string, unknown>, okText: string) {
    if (busy) return;
    setBusy(id);
    setNote(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, idempotencyKey: keyFor(id) }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        keys.current.delete(id);
        setPin("");
        setNote({ ok: true, text: okText });
        router.refresh();
      } else {
        if (data?.code === "PIN") setNeedPin(true);
        setNote({ ok: false, text: data?.message ?? "Noget gik galt. Prøv igen." });
      }
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <Panel>
        <p className="text-[0.88rem] text-stone">
          Ingen henvisninger endnu. Del linket til kundesiden, eller sæt QR-koden op ved kassen.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="p-0">
      {note || (needPin && hasPin) ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-fog px-5 py-3">
          {note ? (
            <p role="status" className={cn("text-[0.85rem]", note.ok ? "text-ink" : "text-rust")}>
              {note.text}
            </p>
          ) : (
            <span />
          )}
          {needPin && hasPin ? (
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="Personale-PIN"
              aria-label="Personale-PIN"
              className="min-h-9 w-36 rounded-full border border-clay bg-white px-4 text-center text-[0.9rem] tracking-[0.2em] outline-none focus:border-terracotta"
            />
          ) : null}
        </div>
      ) : null}
      <ul className="divide-y divide-fog">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-[0.95rem] text-ink">
                {r.referrer.name ?? r.referrer.code ?? "Ukendt"}
                <span className="mx-2 text-slate">til</span>
                {r.referred.name ?? "Ny kunde"}
              </p>
              <p className="text-[0.78rem] text-stone">
                {STATUS[r.status]} · {relativeDk(new Date(r.createdAt))}
                {r.openRewards.length > 0
                  ? ` · ${r.openRewards.length} ${r.openRewards.length === 1 ? "belønning" : "belønninger"} til gode`
                  : ""}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {r.status === "CREATED" ? (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    call(r.id, "/api/henvisninger/kasse/besoeg", { referralId: r.id }, "Første besøg er registreret.")
                  }
                  className={btnClass("primary")}
                >
                  {busy === r.id ? "Et øjeblik" : "Gennemført"}
                </button>
              ) : null}
              {r.openRewards.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  disabled={busy !== null}
                  onClick={() =>
                    call(
                      w.id,
                      "/api/henvisninger/kasse/indloes",
                      { rewardId: w.id, pin: pin || undefined },
                      "Belønningen er indløst.",
                    )
                  }
                  className={btnClass("outline")}
                >
                  {busy === w.id
                    ? "Et øjeblik"
                    : `Indløst: ${rewardPhrase(w.type, w.value)} til ${
                        w.cardId === r.referred.id ? (r.referred.name ?? "ny kunde") : (r.referrer.name ?? "ambassadør")
                      }`}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
