"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, relativeDk } from "@/lib/utils";
import { rewardPhrase } from "@/lib/referral-text";
import { CelebrationToast } from "@/components/Celebrate";
import type { OwedRow, WaitingRow } from "@/lib/referral-desk";

// Henvisningers Overblik som kasse: oeverst et kassefelt (find kunden, scan
// kortet, PIN og dagens to tal), derunder det personalet krydser af. To lister
// med tydelige roller: nye kunder paa vej ("Rabat givet" ved foerste besoeg) og
// beloenninger at give (oftest ambassadoerer; "Indløs"). Soegning paa begge
// parters navn, mobil og kode, og en kort fejring efter hvert tryk.

function newIdemKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function formatPhone(p: string | null): string | null {
  if (!p) return null;
  const m = /^\+45(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(p);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

// Kontaktlinjen: e-mail (nye kunder), ellers mobil (aeldre kort).
function contactLine(c: { email: string | null; phone: string | null }): string | null {
  return c.email ?? formatPhone(c.phone);
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type Toast = { title: string; text?: string };

export function ReferralWorklist({
  waiting,
  owed,
  hasPin,
  initialQuery,
}: {
  waiting: WaitingRow[];
  owed: OwedRow[];
  hasPin: boolean;
  initialQuery: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pin, setPin] = useState("");
  // Een noegle pr. handling, genbrugt ved retry, saa et dobbelttryk = eet resultat.
  const keys = useRef(new Map<string, string>());
  const keyFor = (id: string) => {
    if (!keys.current.has(id)) keys.current.set(id, newIdemKey());
    return keys.current.get(id)!;
  };

  // Soegning: opdatér listen kort efter, man er holdt op med at skrive.
  useEffect(() => {
    if (query === initialQuery) return;
    const t = setTimeout(() => {
      const q = query.trim();
      router.replace(q ? `/app/henvisninger?q=${encodeURIComponent(q)}` : "/app/henvisninger");
    }, 250);
    return () => clearTimeout(t);
  }, [query, initialQuery, router]);

  async function post(id: string, path: string, body: Record<string, unknown>) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, idempotencyKey: keyFor(id), pin: pin || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        keys.current.delete(id);
        return data;
      }
      setError(data?.message ?? "Noget gik galt. Prøv igen.");
    } catch {
      setError("Ingen forbindelse. Prøv igen.");
    } finally {
      setBusy(null);
    }
    return null;
  }

  async function giveDiscount(row: WaitingRow) {
    const data = await post(row.referralId, "/api/henvisninger/kasse/besoeg", { referralId: row.referralId });
    if (!data) return;
    const ambassador = (data.rewards as { role: string; type: "AMOUNT" | "STAMPS" | "SERVICE"; value: string }[]).find(
      (r) => r.role === "referrer",
    );
    setToast({
      title: `${row.referred.name ?? "Den nye kunde"} har fået sin rabat`,
      text: ambassador
        ? `${row.referrer.name ?? "Ambassadøren"} har nu ${rewardPhrase(ambassador.type, ambassador.value)} til gode.`
        : `${row.referrer.name ?? "Ambassadøren"} har nået månedens loft, så der er ingen ny belønning.`,
    });
    router.refresh();
  }

  async function redeem(row: OwedRow) {
    const data = await post(row.rewardId, "/api/henvisninger/kasse/indloes", { rewardId: row.rewardId });
    if (!data) return;
    setToast({
      title: `${cap(rewardPhrase(row.type, row.value))} er indløst`,
      text: `${row.card.name ?? "Kunden"} har fået sin belønning.`,
    });
    router.refresh();
  }

  const buttonCls =
    "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-[0.92rem] font-[500] text-parchment shadow-card transition-transform hover:bg-black active:scale-[0.97] disabled:opacity-50";

  return (
    <div className="flex flex-col gap-8">
      {toast ? <CelebrationToast title={toast.title} text={toast.text} onDone={() => setToast(null)} /> : null}

      {/* Kassefeltet: det foerste personalet ser, naar en kunde staar ved disken. */}
      <section className="rounded-[22px] bg-ink p-5 text-white shadow-lift sm:p-6">
        <h2 className="text-[1.3rem] font-[700] tracking-[-0.02em]">Hvem står ved disken?</h2>
        <p className="mt-1 text-[0.9rem] text-white/65">
          Find kunden eller scan kortet. Giv rabatten til nye kunder, og indløs belønninger.
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Navn, e-mail eller kode"
            aria-label="Find kunde"
            autoComplete="off"
            className="min-h-12 flex-1 rounded-full bg-white px-5 text-[1rem] text-ink outline-none placeholder:text-slate focus:ring-2 focus:ring-white/60"
          />
          <Link
            href="/app/kasse?visning=henvisninger"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/30 px-5 text-[0.95rem] font-[500] text-white hover:bg-white/10"
          >
            <ScanIcon />
            Scan kort
          </Link>
          {hasPin ? (
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="PIN"
              aria-label="Personale-PIN"
              className="min-h-12 rounded-full bg-white/10 px-5 text-center text-[1rem] tracking-[0.2em] text-white outline-none placeholder:text-white/50 focus:ring-2 focus:ring-white/60 sm:w-28"
            />
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <a href="#nye" className="rounded-[14px] bg-white/10 px-4 py-3 hover:bg-white/15">
            <span className="block text-[1.8rem] font-[700] leading-none">{waiting.filter((w) => !w.stale).length}</span>
            <span className="mt-1 block text-[0.82rem] text-white/70">nye kunder på vej</span>
          </a>
          <a href="#beloenninger" className="rounded-[14px] bg-white/10 px-4 py-3 hover:bg-white/15">
            <span className="block text-[1.8rem] font-[700] leading-none">{owed.length}</span>
            <span className="mt-1 block text-[0.82rem] text-white/70">belønninger at give</span>
          </a>
        </div>
      </section>

      {error ? (
        <p role="alert" className="-mt-4 rounded-xl border border-rust/30 bg-rust/5 px-4 py-3 text-[0.9rem] text-rust">
          {error}
        </p>
      ) : null}

      <section id="nye" className="scroll-mt-6">
        <SectionTitle
          title="Nye kunder på vej"
          count={waiting.length}
          text="Venner, en kunde har henvist. Giv rabatten ved deres første besøg, og tryk Rabat givet."
        />
        {waiting.length === 0 ? (
          <Empty text={query ? "Ingen nye kunder matcher." : "Ingen lige nu. Når en ven tilmelder sig via et link, står vedkommende her."} />
        ) : (
          <ul className="flex flex-col gap-2">
            {waiting.map((w) => (
              <li
                key={w.referralId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fog bg-white px-5 py-4 shadow-card"
              >
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[1.05rem] font-[600] text-ink">{w.referred.name ?? "Ny kunde"}</span>
                    <Role kind="ny" />
                  </p>
                  <p className="text-[0.82rem] text-stone">
                    Henvist af <span className="text-ink">{w.referrer.name ?? w.referrer.code}</span>
                    {contactLine(w.referred) ? ` · ${contactLine(w.referred)}` : ""} · {relativeDk(w.createdAt)}
                  </p>
                </div>
                {w.stale ? (
                  <span className="text-[0.85rem] text-slate">Udløbet</span>
                ) : (
                  <button type="button" disabled={busy !== null} onClick={() => giveDiscount(w)} className={buttonCls}>
                    <CheckIcon />
                    {busy === w.referralId ? "Et øjeblik" : "Rabat givet"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="beloenninger" className="scroll-mt-6">
        <SectionTitle
          title="Belønninger at give"
          count={owed.length}
          text="Kunder med en belønning til gode, oftest ambassadører, hvis ven har været her. Tryk Indløs, når de bruger den."
        />
        {owed.length === 0 ? (
          <Empty text={query ? "Ingen belønninger matcher." : "Ingen lige nu. Når en ven har været her, står ambassadørens belønning her."} />
        ) : (
          <ul className="flex flex-col gap-2">
            {owed.map((o) => (
              <li
                key={o.rewardId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-fog bg-white px-5 py-4 shadow-card"
              >
                <div className="min-w-0">
                  <p className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[1.05rem] font-[600] text-ink">{o.card.name ?? "Kunde"}</span>
                    <Role kind={o.forReferring ? "ambassador" : "ny"} />
                  </p>
                  <p className="text-[0.82rem] text-stone">
                    {o.forReferring ? (
                      <>
                        For at henvise <span className="text-ink">{o.forReferring}</span>
                      </>
                    ) : (
                      "Velkomstrabat"
                    )}
                    {contactLine(o.card) ? ` · ${contactLine(o.card)}` : ""}
                  </p>
                </div>
                <button type="button" disabled={busy !== null} onClick={() => redeem(o)} className={buttonCls}>
                  <GiftIcon />
                  {busy === o.rewardId ? "Et øjeblik" : `Indløs ${rewardPhrase(o.type, o.value)}`}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ title, count, text }: { title: string; count: number; text: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-[1.2rem] font-[700] tracking-[-0.02em] text-ink">
        {title} <span className="font-[400] text-slate">{count}</span>
      </h2>
      <p className="mt-0.5 text-[0.88rem] text-stone">{text}</p>
    </div>
  );
}

// Hvem er hvem: den nye kunde (vennen) og ambassadoeren (kunden, der henviste).
function Role({ kind }: { kind: "ny" | "ambassador" }) {
  return kind === "ny" ? (
    <span className="shrink-0 rounded-full border border-clay px-2 py-0.5 text-[0.7rem] font-[500] text-stone">Ny kunde</span>
  ) : (
    <span className="shrink-0 rounded-full bg-[#111] px-2 py-0.5 text-[0.7rem] font-[500] text-white">Ambassadør</span>
  );
}

function Empty({ text }: { text: string }) {
  return <p className={cn("rounded-xl border border-dashed border-clay px-5 py-4 text-[0.88rem] text-stone")}>{text}</p>;
}

function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="1" />
      <path d="M3 10h18M12 10v10M12 10C10 10 8 9 8 7.5S10 5.5 12 10ZM12 10c2 0 4-1 4-2.5S14 5.5 12 10Z" />
    </svg>
  );
}
