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
  ResendLoginButton,
  FlagToggle,
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
  newCustomers7d: number;
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

type Filter = "all" | "over" | "near" | "pending" | "paused" | "stopped";
type Sort = "cardholders" | "growth" | "active" | "newest";

// Kanoniske tilstande, saa taeller og filter altid er enige.
const isOver = (r: Row) => r.customers >= FREE_CUSTOMER_LIMIT;
const isNear = (r: Row) =>
  r.customers >= FREE_CUSTOMER_WARN && r.customers < FREE_CUSTOMER_LIMIT;
const isPending = (r: Row) =>
  r.customers >= FREE_CUSTOMER_WARN && !r.proApprovedAt;

export function AdminBusinesses({ rows }: { rows: Row[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("cardholders");

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
    const list = rows.filter((r) => {
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
    const at = (d: Date | null) => (d ? d.getTime() : 0);
    return [...list].sort((a, b) => {
      switch (sort) {
        case "growth":
          return b.newCustomers7d - a.newCustomers7d;
        case "active":
          return at(b.lastActive) - at(a.lastActive);
        case "newest":
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return b.customers - a.customers;
      }
    });
  }, [rows, q, filter, sort]);

  const attention: { key: Filter; label: string; n: number }[] = [
    { key: "over", label: "Over 100 (fakturér)", n: counts.over },
    { key: "near", label: "Nær grænsen (80+)", n: counts.near },
    { key: "pending", label: "Afventer godkendelse", n: counts.pending },
    { key: "paused", label: "På pause", n: counts.paused },
    { key: "stopped", label: "Stoppet", n: counts.stopped },
  ];

  const sorts: { key: Sort; label: string }[] = [
    { key: "cardholders", label: "Kortholdere" },
    { key: "growth", label: "Nye 7d" },
    { key: "active", label: "Sidst aktiv" },
    { key: "newest", label: "Nyeste" },
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
                  ? "border-terracotta bg-terracotta/10"
                  : muted
                    ? "border-fog bg-white text-slate"
                    : "border-clay bg-white hover:border-terracotta",
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
          className="min-w-[15rem] flex-1 rounded-md border border-fog bg-white px-3 py-2 text-[0.85rem] text-ink outline-none focus:border-terracotta"
        />
        <div className="flex items-center gap-1 rounded-md border border-fog bg-white p-1">
          <span className="px-1.5 text-[0.62rem] font-[400] uppercase tracking-[0.1em] text-slate">
            Sortér
          </span>
          {sorts.map(({ key, label }) => (
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
        Viser {shown.length} af {rows.length}. Klik en butik for detaljer og
        styring.
        {filter !== "all" ? (
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="ml-2 text-terracotta underline underline-offset-2 hover:text-terracotta-dark"
          >
            Ryd filter
          </button>
        ) : null}
      </p>

      {shown.length === 0 ? (
        <p className="rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
          Ingen butikker matcher. Ryd søgning eller filter.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-fog bg-white shadow-card">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.84rem]">
            <thead>
              <tr className="border-b border-fog text-[0.6rem] uppercase tracking-[0.1em] text-slate">
                <th className="px-4 py-3 font-[500]">Butik</th>
                <th className="px-4 py-3 text-right font-[500]">Kortholdere</th>
                <th className="px-4 py-3 text-right font-[500]">Nye 7d</th>
                <th className="px-4 py-3 text-right font-[500]">Stempler</th>
                <th className="px-4 py-3 font-[500]">Sidst aktiv</th>
                <th className="px-4 py-3 font-[500]">Plan</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <BusinessRow key={r.id} r={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 text-slate transition-transform ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function BusinessRow({ r }: { r: Row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer border-b border-fog/70 align-middle transition-colors hover:bg-sand/40"
      >
        <td className="px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-[400] text-ink">{r.name}</span>
            {r.stopped ? <Dot tone="rust" title="Stoppet" /> : null}
            {r.newSignupsPaused ? <Dot tone="amber" title="På pause" /> : null}
            {isOver(r) ? <Dot tone="amber" title="Over 100" /> : null}
            {r.proApprovedAt ? (
              <Dot tone="terracotta" title="Pro godkendt" />
            ) : null}
          </div>
          <span className="font-[300] text-[0.72rem] text-slate">/{r.slug}</span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
          <span className={isOver(r) ? "font-[500] text-terracotta" : "text-ink"}>
            {formatDkNumber(r.customers)}
          </span>
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
          {r.newCustomers7d > 0 ? (
            <span className="font-[500] text-terracotta">
              +{formatDkNumber(r.newCustomers7d)}
            </span>
          ) : (
            <span className="text-slate">0</span>
          )}
        </td>
        <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-ink">
          {formatDkNumber(r.stamps)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 font-[300] text-slate">
          {r.lastActive ? formatDkDate(r.lastActive) : "Ingen"}
        </td>
        <td className="whitespace-nowrap px-4 py-3">
          <PlanBadge plan={r.plan} />
        </td>
        <td className="px-2 py-3 text-right">
          <Chevron open={open} />
        </td>
      </tr>

      {open ? (
        <tr className="border-b border-fog/70 bg-sand/20">
          <td colSpan={7} className="px-4 py-4">
            <BusinessDetail r={r} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

function BusinessDetail({ r }: { r: Row }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Hoved: oprettet + hurtige handlinger */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-[300] text-[0.76rem] text-slate">
          <Link
            href={`/k/${r.slug}`}
            className="text-terracotta underline-offset-2 hover:underline"
          >
            Åbn kortside
          </Link>{" "}
          · Oprettet {formatDkDate(r.createdAt)}
          {r.termsAcceptedAt
            ? ` · Vilkår accepteret ${formatDkDate(r.termsAcceptedAt)}`
            : " · Vilkår ikke registreret"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <PlanSelect businessId={r.id} plan={r.plan} />
          <ResetStampsButton businessId={r.id} />
          <DeleteButton businessId={r.id} name={r.name} />
        </div>
      </div>

      {/* Aktivitet */}
      <div className="grid grid-cols-2 gap-4 rounded-md border border-fog bg-white px-4 py-3 sm:grid-cols-5">
        <Metric label="Kortholdere" value={formatDkNumber(r.customers)} />
        <Metric
          label="Nye (7 dage)"
          value={r.newCustomers7d > 0 ? `+${formatDkNumber(r.newCustomers7d)}` : "0"}
        />
        <Metric label="Stempler" value={formatDkNumber(r.stamps)} />
        <Metric label="Indløst" value={formatDkNumber(r.redemptions)} />
        <Metric
          label="Sidst aktiv"
          value={r.lastActive ? formatDkDateTime(r.lastActive) : "Ingen"}
        />
      </div>

      {/* Ejer / kontakt */}
      <div className="rounded-md border border-fog bg-white px-4 py-3">
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
                      o.verified ? "text-terracotta" : "text-rust/80"
                    }`}
                  >
                    {o.verified ? "✓ verificeret" : "ikke verificeret"}
                  </span>
                  <EditOwner userId={o.id} email={o.email} name={o.name} />
                  <ResendLoginButton email={o.email} />
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

      {/* Pro & fakturering */}
      <div className="rounded-md border border-fog bg-white px-4 py-3">
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
          proPriceUntil={r.proPriceUntil ? isoDate(r.proPriceUntil) : ""}
          lastInvoicedAt={r.lastInvoicedAt ? isoDate(r.lastInvoicedAt) : ""}
        />
      </div>

      {/* Indstillinger: branche/placering er info, resten kan slaas til/fra */}
      <div className="flex flex-col gap-3 rounded-md border border-fog bg-white px-4 py-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1.5">
          <Fact label="Branche" value={r.category || "-"} />
          <Fact label="Placering" value={r.hasLocation ? "Ja" : "Nej"} />
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <FlagToggle
            businessId={r.id}
            flag="selfScanEnabled"
            value={r.selfScan}
            label="Selvscan"
          />
          <FlagToggle
            businessId={r.id}
            flag="welcomeStampEnabled"
            value={r.welcomeStamp}
            label="Velkomststempel"
          />
          <FlagToggle
            businessId={r.id}
            flag="weeklyEmailEnabled"
            value={r.weeklyEmail}
            label="Ugebrev"
          />
        </div>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: "FREE" | "PRO" }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-[0.62rem] font-[500] uppercase tracking-[0.06em] ${
        plan === "PRO"
          ? "border-terracotta/40 bg-terracotta/5 text-terracotta"
          : "border-fog bg-sand/60 text-slate"
      }`}
    >
      {plan}
    </span>
  );
}

// Lille statusprik i tabelraekken (fuld tekst vises i detaljen).
function Dot({
  tone,
  title,
}: {
  tone: "rust" | "amber" | "terracotta";
  title: string;
}) {
  const cls =
    tone === "rust"
      ? "bg-rust"
      : tone === "amber"
        ? "bg-[#C9A24B]"
        : "bg-terracotta";
  return (
    <span
      title={title}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${cls}`}
    />
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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}
