import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeading, Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { formatDkDate, formatDkNumber, relativeDk } from "@/lib/utils";
import { normalizeReferralCode } from "@/lib/referral-code";

export const metadata: Metadata = { title: "Kunder" };
export const dynamic = "force-dynamic";

// Kunder: alle butikkens kortholdere paa tvaers af produkterne. Stempelkunder er
// som regel anonyme (kun et kort), henvisningskunder har navn, mobil og kode.
// Kun laesning; handlinger sker via Scan.

const PAGE_SIZE = 50;

function formatPhone(p: string | null): string | null {
  if (!p) return null;
  const m = /^\+45(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(p);
  return m ? `${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { business } = await requireBusiness();
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);

  // Butikken afgoeres af kortets skabelon, saa ogsaa stempelkunder uden
  // denormaliseret businessId kommer med.
  const scope: Prisma.CustomerCardWhereInput = { card: { businessId: business.id } };
  const digits = q.replace(/\D/g, "");
  const where: Prisma.CustomerCardWhereInput = q
    ? {
        AND: [
          scope,
          {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { referralCode: normalizeReferralCode(q) },
              { serial: { startsWith: q } },
              ...(digits.length >= 4 ? [{ phone: { contains: digits } }] : []),
            ],
          },
        ],
      }
    : scope;

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
        phone: true,
        referralCode: true,
        stamps: true,
        completedCount: true,
        createdAt: true,
        lastStampAt: true,
        referredBy: { select: { name: true } },
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

  return (
    <>
      <PageHeading
        title="Kunder"
        subtitle={`${formatDkNumber(total)} ${total === 1 ? "kortholder" : "kortholdere"} i alt.`}
      />

      <form className="mb-5 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={q}
          placeholder="Søg på navn, mobil, kode eller kortnummer"
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
            {q ? "Ingen kunder matcher din søgning." : "Ingen kortholdere endnu."}
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
                  <p className="text-[0.76rem] text-slate">
                    {[
                      formatPhone(c.phone),
                      c.referralCode,
                      c.referredBy?.name ? `henvist af ${c.referredBy.name}` : null,
                      `oprettet ${formatDkDate(c.createdAt)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
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
