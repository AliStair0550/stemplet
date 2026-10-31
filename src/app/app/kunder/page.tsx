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

// Kunder: butikkens kartotek. Her finder man en kunde, ser hvor langt de er, og
// sletter en kunde, der beder om det. Det daglige arbejde sker paa Scan og Hjem
// (hvem venter paa noget), saa siden er bygget til at slaa op: soegning oeverst,
// filtre med tal i, og rene raekker. Et tryk paa en kunde aabner den i kassen
// (samme kundekort som ved scan), hvor man giver stempler, rabat eller
// belønning. "Slet" ligger under "Rediger" (?rediger=1), ikke paa hver raekke.

type Vis = "alle" | "klar" | "nye" | "stemplet" | "henvisninger";
const DAY = 24 * 60 * 60 * 1000;

const PAGE_SIZE = 50;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; vis?: string; rediger?: string }>;
}) {
  const { business } = await requireBusiness();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 60);
  const editing = sp.rediger === "1";
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

  const [total, newCount, readyCount, cards] = await Promise.all([
    prisma.customerCard.count({ where: scope }),
    prisma.customerCard.count({ where: { AND: [scope, newWhere] } }),
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

  // Bevar filter og soegning, naar man skifter til og fra Rediger.
  const listHref = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (vis !== "alle") params.set("vis", vis);
    if (q) params.set("q", q);
    for (const [k, v] of Object.entries(extra)) if (v) params.set(k, v);
    const qs = params.toString();
    return qs ? `/app/kunder?${qs}` : "/app/kunder";
  };

  const filters: [Vis, string, number | null][] = [
    ["alle", "Alle", total],
    ["klar", "Klar til belønning", readyCount],
    ["nye", "Nye", newCount],
    ...(both
      ? ([
          ["stemplet", "Stempler", null],
          ["henvisninger", "Henvisninger", null],
        ] as [Vis, string, null][])
      : []),
  ];

  return (
    <>
      <PageHeading title="Kunder" subtitle="Find en kunde og se, hvor langt de er. Tryk på en kunde for at give stempler eller en belønning." />

      <form className="mb-3" role="search">
        {vis !== "alle" ? <input type="hidden" name="vis" value={vis} /> : null}
        <label className="relative block">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="pointer-events-none absolute left-4 top-1/2 h-[1.1rem] w-[1.1rem] -translate-y-1/2 text-slate" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Søg på navn, e-mail eller mobil"
            aria-label="Søg kunde"
            enterKeyHint="search"
            className="min-h-12 w-full rounded-full border border-clay bg-white pl-11 pr-5 text-[1rem] text-ink outline-none focus:border-ink"
          />
        </label>
      </form>

      <nav aria-label="Vis kunder" className="-mx-5 mb-4 flex gap-1.5 overflow-x-auto px-5 [scrollbar-width:none] md:mx-0 md:px-0">
        {filters.map(([v, label, count]) => (
          <Link
            key={v}
            href={v === "alle" ? "/app/kunder" : `/app/kunder?vis=${v}`}
            aria-current={vis === v ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-[0.85rem] transition-colors",
              vis === v ? "border-ink bg-ink font-[600] text-white" : "border-clay bg-white text-ink hover:border-ink",
            )}
          >
            {label}
            {count !== null ? (
              <span
                className={cn(
                  "tabular-nums",
                  vis === v ? "text-white/70" : v === "klar" && count > 0 ? "font-[600] text-[#1B5EAE]" : "text-slate",
                )}
              >
                {formatDkNumber(count)}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="mb-2 flex items-center justify-between px-1">
        <p className="text-[0.8rem] text-slate">
          {q ? `Søgning: ${q}` : vis === "alle" ? "Senest besøgt først" : null}
        </p>
        {cards.length > 0 ? (
          <Link href={listHref({ rediger: editing ? undefined : "1" })} className="rounded-full px-3 py-1.5 text-[0.85rem] font-[500] text-ink hover:bg-sand">
            {editing ? "Færdig" : "Rediger"}
          </Link>
        ) : null}
      </div>

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
            {cards.map((c) => {
              const showStamps = business.stampsEnabled && (c.lifetimeStamps > 0 || !c.referralCode);
              const rewardReady = (business.stampsEnabled && c.stamps >= required) || c._count.rewards > 0;
              const firstVisit = c.referralReceived?.status === "CREATED";
              // Een linje om, hvor kunden er: stempler eller henvisning, og hvornaar.
              const status = [
                showStamps ? `${Math.min(c.stamps, required)} af ${required} stempler` : null,
                c.referredBy?.name ? `henvist af ${c.referredBy.name}` : null,
                c._count.referralsMade > 0 ? `har henvist ${c._count.referralsMade}` : null,
                c.lastStampAt ? relativeDk(c.lastStampAt) : `ny ${formatDkDate(c.createdAt)}`,
              ]
                .filter(Boolean)
                .join(" · ");
              const name = c.name ?? `Kortholder #${c.serial.slice(0, 6)}`;
              const body = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-[0.95rem] font-[600] text-ink" aria-hidden>
                    {(c.name ?? "#").trim().charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    {/* Navn og evt. maerke oeverst, saa statuslinjen faar hele bredden. */}
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[0.98rem] font-[600] text-ink">{name}</span>
                      {rewardReady || firstVisit ? (
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-[600]",
                            rewardReady ? "bg-[#1B5EAE] text-white" : "bg-[#E8F0FB] text-[#1B5EAE]",
                          )}
                        >
                          {rewardReady ? "Belønning klar" : "Første besøg"}
                        </span>
                      ) : null}
                    </span>
                    <span className="block truncate text-[0.8rem] text-stone first-letter:uppercase">{status}</span>
                    {showStamps ? (
                      <span className="mt-1.5 block h-1 w-full max-w-[12rem] overflow-hidden rounded-full bg-[#E8EDF3]" aria-hidden>
                        <span className="block h-full rounded-full bg-[#1B5EAE]" style={{ width: `${Math.min(100, (c.stamps / required) * 100)}%` }} />
                      </span>
                    ) : null}
                  </span>
                </>
              );
              return (
                <li key={c.id}>
                  {editing ? (
                    <div className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                      {body}
                      <DeleteCustomerButton id={c.id} name={c.name ?? "kortholderen"} />
                    </div>
                  ) : (
                    <Link
                      href={`/app/kasse?kort=${encodeURIComponent(c.serial)}`}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors active:bg-sand/70 sm:px-6 md:hover:bg-sand/40"
                    >
                      {body}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-slate" aria-hidden>
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
      {cards.length === PAGE_SIZE ? (
        <p className="mt-3 text-[0.78rem] text-slate">Viser de {PAGE_SIZE} seneste. Søg for at finde en bestemt kunde.</p>
      ) : null}
    </>
  );
}
