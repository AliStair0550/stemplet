"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FREE_CUSTOMER_LIMIT, FREE_CUSTOMER_WARN } from "@/lib/plans";
import { formatDkNumber, formatDkDate, formatDkDateTime } from "@/lib/utils";
import {
  CopyEmail,
  PlanSelect,
  DeleteButton,
  ResetStampsButton,
  EditOwner,
  EditBilling,
  PauseButton,
  StopButton,
} from "./AdminControls";

export type Owner = {
  id: string;
  email: string;
  name: string | null;
  verified: boolean;
};

export type Row = {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO";
  category: string | null;
  createdAt: Date;
  termsAcceptedAt: Date | null;
  hasLocation: boolean;
  selfScan: boolean;
  welcomeStamp: boolean;
  weeklyEmail: boolean;
  owners: Owner[];
  customers: number;
  stamps: number;
  redemptions: number;
  lastActive: Date | null;
  isDemo: boolean;
  proApprovedAt: Date | null;
  reached100At: Date | null;
  proPriceKr: number;
  proPriceUntil: Date | null;
  effectivePriceKr: number;
  lastInvoicedAt: Date | null;
  newSignupsPaused: boolean;
  stopped: boolean;
};

type Filter =
  | "all"
  | "over"
  | "near"
  | "pending"
  | "paused"
  | "stopped";

// Kanoniske tilstande, saa taeller og filter altid er enige.
const isOver = (r: Row) => r.customers >= FREE_CUSTOMER_LIMIT;
const isNear = (r: Row) =>
  r.customers >= FREE_CUSTOMER_WARN && r.customers < FREE_CUSTOMER_LIMIT;
const isPending = (r: Row) =>
  r.customers >= FREE_CUSTOMER_WARN && !r.proApprovedAt;

export function AdminBusinesses({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<"cardholders" | "newest">("cardholders");

  const counts = useMemo(
    () => ({
      over: rows.filter(isOver).length,
      near: rows.filter(isNear).length,
      pending: rows.filter(isPending).length,
      paused: rows.filter((r) => r.newSignupsPaused).length,
      stopped: rows.filter((r) => r.stopped).length,
    }),
    [rows],
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (needle) {
        const hay =
          `${r.name} ${r.slug} ${r.owners.map((o) => o.email).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      switch (filter) {
        case "over":
          return isOver(r);
        case "near":
          return isNear(r);
        case "pending":
          return isPending(r);
        case "paused":
          return r.newSignupsPaused;
        case "stopped":
          return r.stopped;
        default:
          return true;
      }
    });
    list = [...list].sort((a, b) =>
      sort === "cardholders"
        ? b.customers - a.customers
        : b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return list;
  }, [rows, q, filter, sort]);

  const attention: { key: Filter; label: string; n: number }[] = [
    { key: "over", label: "Over 100 (fakturér)", n: counts.over },
    { key: "near", label: "Nær grænsen (80+)", n: counts.near },
    { key: "pending", label: "Afventer godkendelse", n: counts.pending },
    { key: "paused", label: "På pause", n: counts.paused },
    { key: "stopped", label: "Stoppet", n: counts.stopped },
  ];

  return (
    <div className="mt-4 flex flex-col gap-4">
      {/* Kraever handling: klik for at filtrere */}
      <div className="flex flex-wrap gap-2">
        {attention.map((a) => {
          const active = filter === a.key;
          const muted = a.n === 0;
          return (
            <button
              key={a.key}
              type="button"
              onClick={() => setFilter(active ? "all" : a.key)}
              className={[
                "rounded-lg border px-3 py-2 text-left transition-colors",
                active
                  ? "border-moss bg-moss/10"
                  : muted
                    ? "border-fog bg-white text-slate"
                    : "border-clay bg-white hover:border-moss",
              ].join(" ")}
            >
              <span className="block text-[1.1rem] font-[300] tabular-nums text-ink">
                {a.n}
              </span>
              <span className="block text-[0.66rem] font-[400] uppercase tracking-[0.08em] text-slate">
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Soegning + sortering */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Søg butik, slug eller ejer-email"
          className="min-w-[16rem] flex-1 rounded-md border border-fog bg-white px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-moss"
        />
        <div className="flex items-center gap-1 rounded-md border border-fog bg-white p-1">
          {(
            [
              ["cardholders", "Kortholdere"],
              ["newest", "Nyeste"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSort(key)}
              className={[
                "rounded px-2.5 py-1 text-[0.72rem] font-[400] transition-colors",
                sort === key ? "bg-ink text-parchment" : "text-slate hover:text-ink",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Aktivt filter + antal */}
      <p className="text-[0.74rem] font-[300] text-slate">
        Viser {shown.length} af {rows.length}
        {filter !== "all" ? (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="ml-2 text-moss underline underline-offset-2 hover:text-moss-light"
          >
            Ryd filter
          </button>
        ) : null}
      </p>

      <div className="flex flex-col gap-4">
        {shown.map((r) => (
          <BusinessCard key={r.id} r={r} />
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
          Ingen butikker matcher. Ryd søgning eller filter.
        </p>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6rem] font-[400] uppercase tracking-[0.12em] text-slate">
        {label}
      </p>
      <p className="mt-0.5 font-[400] text-[0.95rem] tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[0.76rem] font-[300] text-stone">
      <span className="text-slate">{label}:</span> {value}
    </span>
  );
}

function StateBadge({ text, tone }: { text: string; tone: "rust" | "amber" | "moss" }) {
  const cls =
    tone === "rust"
      ? "border-rust/40 bg-rust/5 text-rust"
      : tone === "amber"
        ? "border-clay bg-sand text-ink"
        : "border-moss/40 bg-moss/5 text-moss";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[0.6rem] font-[500] uppercase tracking-[0.08em] ${cls}`}
    >
      {text}
    </span>
  );
}

function BusinessCard({ r }: { r: Row }) {
  return (
    <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
      {/* Titel + tilstands-badges + plan + slet */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-[400] text-[1.05rem] text-ink">{r.name}</span>
            <Link
              href={`/k/${r.slug}`}
              className="font-[300] text-[0.78rem] text-slate underline-offset-2 hover:text-ink hover:underline"
            >
              /{r.slug}
            </Link>
            {r.stopped ? <StateBadge text="Stoppet" tone="rust" /> : null}
            {r.newSignupsPaused ? (
              <StateBadge text="Pause" tone="amber" />
            ) : null}
            {isOver(r) ? <StateBadge text="Over 100" tone="amber" /> : null}
            {r.proApprovedAt ? (
              <StateBadge text="Pro godkendt" tone="moss" />
            ) : null}
          </div>
          <p className="mt-1 font-[300] text-[0.76rem] text-slate">
            Oprettet {formatDkDate(r.createdAt)}
            {r.termsAcceptedAt
              ? ` · Vilkår accepteret ${formatDkDate(r.termsAcceptedAt)}`
              : " · Vilkår ikke registreret"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PlanSelect businessId={r.id} plan={r.plan} />
          <ResetStampsButton businessId={r.id} />
          <DeleteButton businessId={r.id} name={r.name} />
        </div>
      </div>

      {/* Kontaktinfo */}
      <div className="mt-4 rounded-md border border-fog bg-sand/40 px-4 py-3">
        <p className="text-[0.6rem] font-[500] uppercase tracking-[0.12em] text-slate">
          Ejer / kontakt
        </p>
        {r.owners.length ? (
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {r.owners.map((o) => (
              <li key={o.id} className="text-[0.85rem]">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <CopyEmail email={o.email} />
                  {o.name ? (
                    <span className="font-[300] text-stone">{o.name}</span>
                  ) : null}
                  <span
                    className={`text-[0.66rem] font-[400] uppercase tracking-[0.08em] ${
                      o.verified ? "text-moss" : "text-rust/80"
                    }`}
                  >
                    {o.verified ? "✓ verificeret" : "ikke verificeret"}
                  </span>
                  <EditOwner userId={o.id} email={o.email} name={o.name} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 font-[300] text-[0.82rem] text-slate">
            Ingen ejer-konto tilknyttet.
          </p>
        )}
      </div>

      {/* Aktivitet */}
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Kortholdere" value={formatDkNumber(r.customers)} />
        <Metric label="Stempler" value={formatDkNumber(r.stamps)} />
        <Metric label="Indløst" value={formatDkNumber(r.redemptions)} />
        <Metric
          label="Sidst aktiv"
          value={r.lastActive ? formatDkDateTime(r.lastActive) : "Ingen"}
        />
      </div>

      {/* Pro & fakturering */}
      <div className="mt-4 rounded-md border border-fog bg-sand/40 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.6rem] font-[500] uppercase tracking-[0.12em] text-slate">
            Pro &amp; fakturering
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <PauseButton businessId={r.id} paused={r.newSignupsPaused} />
            <StopButton businessId={r.id} stopped={r.stopped} name={r.name} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5">
          <Fact
            label="Kortholdere"
            value={`${formatDkNumber(r.customers)} / ${FREE_CUSTOMER_LIMIT}${
              isOver(r) ? " (over)" : ""
            }`}
          />
          <Fact
            label="Godkendt"
            value={r.proApprovedAt ? formatDkDateTime(r.proApprovedAt) : "Nej"}
          />
          <Fact
            label="Krydsede 100"
            value={r.reached100At ? formatDkDate(r.reached100At) : "-"}
          />
          <Fact
            label="Pris/md"
            value={`${formatDkNumber(r.effectivePriceKr)} kr.${
              r.proPriceUntil ? ` (til ${formatDkDate(r.proPriceUntil)})` : ""
            }`}
          />
          <Fact
            label="Sidst faktureret"
            value={r.lastInvoicedAt ? formatDkDate(r.lastInvoicedAt) : "-"}
          />
        </div>
        <EditBilling
          businessId={r.id}
          proPriceKr={r.proPriceKr}
          proPriceUntil={
            r.proPriceUntil ? isoDate(r.proPriceUntil) : ""
          }
          lastInvoicedAt={r.lastInvoicedAt ? isoDate(r.lastInvoicedAt) : ""}
        />
      </div>

      {/* Indstillinger */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-fog pt-3">
        <Fact label="Branche" value={r.category || "-"} />
        <Fact label="Placering" value={r.hasLocation ? "Ja" : "Nej"} />
        <Fact label="Selvscan" value={r.selfScan ? "Til" : "Fra"} />
        <Fact label="Velkomststempel" value={r.welcomeStamp ? "Til" : "Fra"} />
        <Fact label="Ugebrev" value={r.weeklyEmail ? "Til" : "Fra"} />
      </div>
    </div>
  );
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
