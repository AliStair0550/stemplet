import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { formatDkDate, formatDkNumber, relativeDk } from "@/lib/utils";
import { normalizeReferralCode } from "@/lib/referral-code";
import { readyConditions } from "@/lib/ready-customers";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Kunder" };
export const dynamic = "force-dynamic";

// Kunder: alle butikkens kortholdere paa tvaers af produkterne, i een oversigt.
// Maerker viser produktet: Stemplet (har stempler eller et rent stempelkort) og
// Henvisninger (har en henvisningskode; den gives kun ved tilmelding via
// henvisningssiden). En kunde kan have begge. Har butikken begge produkter, kan
// oversigten filtreres. "Tjek ind" aabner kunden i kassen (samme kundekort som
// ved scan), saa man kan give stempler, rabat eller indloese uden at scanne.
// Oeverst fire tal (i alt, nye, aktive, klar til beloenning), der ogsaa er
// genveje til filtrene.

type Vis = "alle" | "klar" | "nye" | "stemplet" | "henvisninger";
const DAY = 24 * 60 * 60 * 1000;

const PAGE_SIZE = 50;

function formatPhone(p: string | null): string | null {
  if (!p) return null;
  const m = /^\+45(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(p);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vis?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const both = business.stampsEnabled && business.referralsEnabled;
  const vis: Vis =
    sp.vis === "klar" || sp.vis === "nye" || (both && (sp.vis === "stemplet" || sp.vis === "henvisninger")) ? sp.vis : "alle";

  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * DAY);
  const stampCard = await prisma.card.findFirst({
    where: { businessId: business.id, active: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, stampsRequired: true },
  });
  const required = stampCard?.stampsRequired ?? 10;
  const ready = readyConditions(business, stampCard, now);

  // Butikken afgoeres af kortets skabelon, saa ogsaa stempelkunder uden
  // denormaliseret businessId kommer med.
  const scope: Prisma.CustomerCardWhereInput = { card: { businessId: business.id } };
  const readyWhere: Prisma.CustomerCardWhereInput = ready.length ? { OR: ready } : { id: "__ingen__" };
  const newWhere: Prisma.CustomerCardWhereInput = { createdAt: { gte: monthAgo } };
  const activeWhere: Prisma.CustomerCardWhereInput = { lastStampAt: { gte: monthAgo } };
  const digits = q.replace(/\D/g, "");
  const product: Prisma.CustomerCardWhereInput =
    vis === "henvisninger"
      ? { referralCode: { not: null } }
      : vis === "stemplet"
        ? { OR: [{ lifetimeStamps: { gt: 0 } }, { referralCode: null }] }
        : vis === "klar"
          ? readyWhere
          : vis === "nye"
            ? newWhere
            : {};
  const where: Prisma.CustomerCardWhereInput = q
    ? {
        AND: [
          scope,
          product,
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { contactEmail: { contains: q.toLowerCase() } },
              { referralCode: normalizeReferralCode(q) },
              { serial: { startsWith: q } },
              ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
            ],
          },
        ],
      }
    : { AND: [scope, product] };

  const [total, newCount, activeCount, readyCount, cards] = await Promise.all([
    prisma.customerCard.count({ where: scope }),
    prisma.customerCard.count({ where: { AND: [scope, newWhere] } }),
    prisma.customerCard.count({ where: { AND: [scope, activeWhere] } }),
    prisma.customerCard.count({ where: { AND: [scope, readyWhere] } }),
    prisma.customerCard.findMany({
      where,
      orderBy: [{ lastStampAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: PAGE_SIZE,
      select: {
        id: true,
        serial: true,
        name: true,
        contactEmail: true,
        phone: true,
        referralCode: true,
        stamps: true,
        lifetimeStamps: true,
        completedCount: true,
        createdAt: true,
        lastStampAt: true,
        referredBy: { select: { name: true } },
        referralReceived: { select: { status: true } },
        _count: {
          select: {
            rewards: { where: { status: "AVAILABLE", expiresAt: { gt: now } } },
            referralsMade: { where: { status: { in: ["CREATED", "VISITED", "REWARDED"] } } },
          },
        },
      },
    }),
  ]);

  // Ingen kunder endnu: ingen soegning, kun naeste skridt.
  if (total === 0) {
    return (
      <>
        <PageHeading title="Kunder" />
        <Panel>
          <div className="flex flex-col items-start gap-4 py-2">
            <p className="text-[1.05rem] font-[600] text-ink">Ingen kunder endnu.</p>
            <p className="-mt-2 text-[0.9rem] text-stone">Hæng QR-koden op, så kommer de første.</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/app/regler?f=kundekort&vis=1" className={btnClass("primary")}>
                Vis QR-kode
              </Link>
              <Link href="/app/plakat" className={btnClass("outline")}>
                Lav plakat
              </Link>
            </div>
          </div>
        </Panel>
      </>
    );
  }

  return (
    <>
      <PageHeading title="Kunder" />

      {/* Fire tal, der ogsaa er genveje til filtrene. */}
      <div className="mb-5 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        {(
          [
            ["alle", formatDkNumber(total), total === 1 ? "kortholder" : "kortholdere"],
            ["nye", formatDkNumber(newCount), "nye de sidste 30 dage"],
            ...(business.stampsEnabled ? ([[null, formatDkNumber(activeCount), "har fået stempel på 30 dage"]] as const) : []),
            ["klar", formatDkNumber(readyCount), "klar til belønning"],
          ] as const
        ).map(([v, value, label], i) => {
          const body = (
            <>
              <span className={cn("block text-[1.6rem] font-bold leading-none tracking-[-0.03em] tabular-nums", v === "klar" && readyCount > 0 ? "text-[#1B5EAE]" : "text-ink")}>
                {value}
              </span>
              <span className="mt-1.5 block text-[0.76rem] leading-snug text-slate">{label}</span>
            </>
          );
          return v ? (
            <Link
              key={i}
              href={v === "alle" ? "/app/kunder" : `/app/kunder?vis=${v}`}
              className={cn(
                "rounded-[16px] border bg-white p-4 shadow-card transition-colors active:scale-[0.98]",
                vis === v && v !== "alle" ? "border-ink" : "border-fog hover:border-clay",
              )}
            >
              {body}
            </Link>
          ) : (
            <div key={i} className="rounded-[16px] border border-fog bg-white p-4 shadow-card">
              {body}
            </div>
          );
        })}
      </div>

      <nav aria-label="Vis kunder" className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0">
        {(
          [
            ["alle", "Alle"],
            ["klar", "Klar til belønning"],
            ["nye", "Nye"],
            ...(both
              ? ([
                  ["stemplet", "Stempler"],
                  ["henvisninger", "Henvisninger"],
                ] as const)
              : []),
          ] as const
        ).map(([v, label]) => (
          <Link
            key={v}
            href={v === "alle" ? "/app/kunder" : `/app/kunder?vis=${v}`}
            aria-current={vis === v ? "page" : undefined}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-[0.85rem] transition-colors",
              vis === v ? "border-ink bg-ink font-[600] text-white" : "border-clay bg-white text-ink hover:border-ink",
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <form className="mb-5 flex gap-2" role="search">
        {vis !== "alle" ? <input type="hidden" name="vis" value={vis} /> : null}
        <input
          name="q"
          defaultValue={q}
          placeholder="Søg på navn, e-mail, mobil, kode eller kortnummer"
          aria-label="Søg kunde"
          className="min-h-11 flex-1 rounded-full border border-clay bg-white px-5 text-[0.92rem] text-ink outline-none focus:border-ink"
        />
        <button type="submit" className={btnClass("primary")}>
          Søg
        </button>
      </form>

      <Panel className="p-0">
        {cards.length === 0 ? (
          <p className="px-6 py-5 text-[0.9rem] text-stone">
            {q
              ? "Ingen kunder matcher din søgning."
              : vis === "klar"
                ? "Ingen venter på en belønning lige nu."
                : vis === "nye"
                  ? "Ingen nye kunder de sidste 30 dage."
                  : vis === "stemplet"
                ? "Ingen stempelkunder endnu."
                : vis === "henvisninger"
                  ? "Ingen kunder via henvisninger endnu."
                  : "Ingen kortholdere endnu."}
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {cards.map((c) => (
              <li key={c.id} className="px-5 py-4 sm:px-6">
                {/* Navn og Tjek ind paa samme linje, saa knappen altid er inden for tommelfingeren. */}
                <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[0.95rem] font-[600] text-ink">
                    {c.name ?? "Kortholder"}
                    {!c.name ? <span className="ml-2 text-[0.75rem] text-slate">#{c.serial.slice(0, 6)}</span> : null}
                  </p>
                  <p className="truncate text-[0.76rem] text-slate">
                    {[c.contactEmail ?? formatPhone(c.phone), `oprettet ${formatDkDate(c.createdAt)}`].filter(Boolean).join(" · ")}
                  </p>
                </div>
                  <span className="shrink-0">
                  <Link href={`/app/kasse?kort=${encodeURIComponent(c.serial)}`} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-[0.85rem] font-semibold text-white hover:bg-[#0A2D5A]">
                    Tjek ind
                  </Link>
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(business.stampsEnabled && c.stamps >= required) || c._count.rewards > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-[#1B5EAE] px-2.5 py-0.5 text-[0.74rem] font-[600] text-white">
                        Belønning klar
                      </span>
                    ) : null}
                    {c.referralReceived?.status === "CREATED" ? (
                      <span className="inline-flex items-center rounded-full bg-[#E8F0FB] px-2.5 py-0.5 text-[0.74rem] font-[600] text-[#1B5EAE]">
                        Første besøg
                      </span>
                    ) : null}
                    {business.stampsEnabled && (c.lifetimeStamps > 0 || !c.referralCode) ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-fog bg-white px-2.5 py-0.5 text-[0.74rem] text-ink">
                        <span className="font-[600]">Stempler</span>
                      </span>
                    ) : null}
                    {c.referralCode ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#061C3D] px-2.5 py-0.5 text-[0.74rem] text-white">
                        <span className="font-[600]">Henvisning</span>
                        {c.referredBy?.name ? <span className="text-white/75">henvist af {c.referredBy.name}</span> : null}
                      </span>
                    ) : null}
                    {c._count.referralsMade > 0 ? (
                      <span className="inline-flex items-center rounded-full border border-fog bg-white px-2.5 py-0.5 text-[0.74rem] text-ink">
                        Har henvist {c._count.referralsMade}
                      </span>
                    ) : null}
                  </div>
                {/* Stempler kun, naar butikken har Stemplet (ikke kun Henvisninger). */}
                {business.stampsEnabled && (c.lifetimeStamps > 0 || !c.referralCode) ? (
                  <div className="w-full text-[0.8rem] text-stone sm:w-40 sm:text-right">
                    <span className="tabular-nums text-ink">
                      {Math.min(c.stamps, required)}/{required}
                    </span>{" "}
                    stempler
                    {c.completedCount > 0 ? `, ${c.completedCount} fulde kort` : ""}
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#E8EDF3]" aria-hidden>
                      <span className="block h-full rounded-full bg-[#1B5EAE]" style={{ width: `${Math.min(100, (c.stamps / required) * 100)}%` }} />
                    </span>
                    <span className="mt-1 block text-[0.72rem] text-slate">
                      {c.lastStampAt ? `sidst ${relativeDk(c.lastStampAt)}` : "ingen besøg endnu"}
                    </span>
                  </div>
                ) : null}
                </div>
                <div className="mt-1 flex justify-end">
                  <DeleteCustomerButton id={c.id} name={c.name ?? "kortholderen"} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      {cards.length === PAGE_SIZE ? (
        <p className="mt-3 text-[0.78rem] text-slate">Viser de {PAGE_SIZE} seneste. Søg for at finde en bestemt kunde.</p>
      ) : null}
    </>
  );
}
