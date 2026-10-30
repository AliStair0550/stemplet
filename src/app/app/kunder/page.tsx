import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { DeleteCustomerButton } from "./DeleteCustomerButton";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { formatDkDate, formatDkNumber, relativeDk } from "@/lib/utils";
import { normalizeReferralCode } from "@/lib/referral-code";
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
  const vis = both && (sp.vis === "stemplet" || sp.vis === "henvisninger") ? sp.vis : "alle";

  // Butikken afgoeres af kortets skabelon, saa ogsaa stempelkunder uden
  // denormaliseret businessId kommer med.
  const scope: Prisma.CustomerCardWhereInput = { card: { businessId: business.id } };
  const digits = q.replace(/\D/g, "");
  const product: Prisma.CustomerCardWhereInput =
    vis === "henvisninger"
      ? { referralCode: { not: null } }
      : vis === "stemplet"
        ? { OR: [{ lifetimeStamps: { gt: 0 } }, { referralCode: null }] }
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

  const [total, cards, required] = await Promise.all([
    prisma.customerCard.count({ where: scope }),
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
        _count: { select: { rewards: { where: { status: "AVAILABLE", expiresAt: { gt: new Date() } } } } },
      },
    }),
    prisma.card
      .findFirst({
        where: { businessId: business.id, active: true },
        orderBy: { createdAt: "asc" },
        select: { stampsRequired: true },
      })
      .then((c) => c?.stampsRequired ?? 10),
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
      <PageHeading
        title="Kunder"
        subtitle={`${formatDkNumber(total)} ${total === 1 ? "kortholder" : "kortholdere"} i alt.`}
      />

      {both ? (
        <nav aria-label="Vis kunder" className="mb-4 inline-flex rounded-full bg-[#F2F5F9] p-1">
          {(
            [
              ["alle", "Alle"],
              ["stemplet", "Stempler"],
              ["henvisninger", "Henvisninger"],
            ] as const
          ).map(([v, label]) => (
            <Link
              key={v}
              href={v === "alle" ? "/app/kunder" : `/app/kunder?vis=${v}`}
              aria-current={vis === v ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-1.5 text-[0.88rem] transition-colors",
                vis === v ? "bg-white font-[600] text-ink shadow-sm" : "text-stone hover:text-ink",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}

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
              : vis === "stemplet"
                ? "Ingen stempelkunder endnu."
                : vis === "henvisninger"
                  ? "Ingen kunder via henvisninger endnu."
                  : "Ingen kortholdere endnu."}
          </p>
        ) : (
          <ul className="divide-y divide-fog">
            {cards.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-[0.92rem] text-ink">
                    {c.name ?? "Kortholder"}
                    {!c.name ? <span className="ml-2 text-[0.75rem] text-slate">#{c.serial.slice(0, 6)}</span> : null}
                  </p>
                  <p className="truncate text-[0.76rem] text-slate">
                    {[c.contactEmail ?? formatPhone(c.phone), `oprettet ${formatDkDate(c.createdAt)}`].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
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
                        <span className="tracking-[0.03em] text-white/75">{c.referralCode}</span>
                        {c.referredBy?.name ? <span className="text-white/75">· henvist af {c.referredBy.name}</span> : null}
                      </span>
                    ) : null}
                  </div>
                </div>
                {/* Stempler kun, naar butikken har Stemplet (ikke kun Henvisninger). */}
                {business.stampsEnabled && (c.lifetimeStamps > 0 || !c.referralCode) ? (
                  <div className="text-right text-[0.8rem] text-stone">
                    <span className="tabular-nums text-ink">
                      {c.stamps}/{required}
                    </span>{" "}
                    stempler
                    {c.completedCount > 0 ? `, ${c.completedCount} fulde kort` : ""}
                    <span className="block text-[0.72rem] text-slate">
                      {c.lastStampAt ? `sidst ${relativeDk(c.lastStampAt)}` : "ingen besøg endnu"}
                    </span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2">
                  <Link href={`/app/kasse?kort=${encodeURIComponent(c.serial)}`} className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-[0.85rem] font-semibold text-white hover:bg-[#0A2D5A]">
                    Tjek ind
                  </Link>
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
