import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  adminCodeConfigured,
} from "@/lib/admin";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";
import { effectiveProPriceKr } from "@/lib/billing";
import { formatDkNumber, formatDkDateTime } from "@/lib/utils";
import { BarChart } from "@/components/BarChart";
import { AdminUnlock } from "./AdminUnlock";
import { AdminShell } from "./AdminShell";
import { ClearDemoButton } from "./AdminControls";
import { AdminBusinesses, type Row } from "./AdminBusinesses";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type RowMetrics = {
  customers: number;
  newCustomers7d: number;
  stamps: number;
  redemptions: number;
  lastActive: Date | null;
};

// Ren mapping: tallene er allerede aggregeret pr. butik i AdminPage (se nedenfor),
// saa denne er synkron og laver ingen queries. Det fjerner N+1'et, hvor hver
// butik foer koerte 4 queries.
function buildRow(
  b: {
    id: string;
    name: string;
    slug: string;
    plan: "FREE" | "PRO";
    category: string | null;
    createdAt: Date;
    termsAcceptedAt: Date | null;
    stripeCustomerId: string | null;
    latitude: number | null;
    longitude: number | null;
    selfScanEnabled: boolean;
    welcomeStampEnabled: boolean;
    weeklyEmailEnabled: boolean;
    proApprovedAt: Date | null;
    reached100At: Date | null;
    proPriceKr: number;
    proPriceUntil: Date | null;
    lastInvoicedAt: Date | null;
    newSignupsPaused: boolean;
    stopped: boolean;
    memberships: {
      user: {
        id: string;
        email: string;
        name: string | null;
        emailVerified: Date | null;
      };
    }[];
  },
  m: RowMetrics,
): Row {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    plan: b.plan,
    category: b.category,
    createdAt: b.createdAt,
    termsAcceptedAt: b.termsAcceptedAt,
    hasLocation: b.latitude != null && b.longitude != null,
    selfScan: b.selfScanEnabled,
    welcomeStamp: b.welcomeStampEnabled,
    weeklyEmail: b.weeklyEmailEnabled,
    owners: b.memberships.map((m) => ({
      id: m.user.id,
      email: m.user.email,
      name: m.user.name,
      verified: m.user.emailVerified != null,
    })),
    customers: m.customers,
    newCustomers7d: m.newCustomers7d,
    stamps: m.stamps,
    redemptions: m.redemptions,
    lastActive: m.lastActive,
    isDemo: b.slug === DEMO_SLUG,
    proApprovedAt: b.proApprovedAt,
    reached100At: b.reached100At,
    proPriceKr: b.proPriceKr,
    proPriceUntil: b.proPriceUntil,
    effectivePriceKr: effectiveProPriceKr(b),
    lastInvoicedAt: b.lastInvoicedAt,
    newSignupsPaused: b.newSignupsPaused,
    stopped: b.stopped,
  };
}

// Bygger et 7-dages soejle-datasaet af demo-hentninger. Bucket OG etiket i dansk
// tidszone, saa en hentning ved midnat lander paa den rigtige dag (ikke UTC-dagen).
// Anker ved kl. 12 UTC og skridt hele doegn, saa sommertidsskift aldrig taber
// eller dublerer en dag.
function buildDemoSeries(
  events: Date[],
): { label: string; count: number; sublabel: string }[] {
  const keyFmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Copenhagen",
  });
  const labelFmt = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    day: "numeric",
    month: "short",
  });
  const wdFmt = new Intl.DateTimeFormat("da-DK", {
    timeZone: "Europe/Copenhagen",
    weekday: "short",
  });
  const buckets = new Map<string, number>();
  const days: { key: string; label: string; sublabel: string }[] = [];
  const noon = new Date();
  noon.setUTCHours(12, 0, 0, 0);
  for (let i = 6; i >= 0; i--) {
    const d = new Date(noon.getTime() - i * 86_400_000);
    const key = keyFmt.format(d);
    buckets.set(key, 0);
    days.push({
      key,
      label: labelFmt.format(d),
      sublabel: wdFmt.format(d).replace(".", ""),
    });
  }
  for (const e of events) {
    const key = keyFmt.format(e);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return days.map((d) => ({
    label: d.label,
    count: buckets.get(d.key) ?? 0,
    sublabel: d.sublabel,
  }));
}

// Sektions-overskrift med een forklarende linje, saa hver del af admin er til at
// forstaa uden forhaandsviden.
function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="font-[400] text-[0.95rem] tracking-[0.01em] text-ink">
        {title}
      </h2>
      <p className="mt-1 font-[300] text-[0.82rem] leading-relaxed text-slate">
        {desc}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.6rem] font-[400] uppercase tracking-[0.12em] text-slate">
        {label}
      </p>
      <p className="mt-1 font-[300] text-[1.1rem] tabular-nums text-ink">
        {value}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  // Kun superadmin (SUPERADMIN_EMAIL). Alle andre faar 404, saa siden ikke
  // engang roeber, at den findes.
  const admin = await getSuperadminEmail();
  if (!admin) notFound();

  // Ekstra kode-laas: er ADMIN_ACCESS_CODE sat, kraeves koden ud over email-login.
  if (!(await isAdminUnlocked())) {
    return <AdminUnlock />;
  }
  const codeLock = adminCodeConfigured();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      memberships: {
        select: {
          user: {
            select: { id: true, email: true, name: true, emailVerified: true },
          },
        },
      },
      cards: { select: { id: true } },
    },
  });

  // Aggreger pr. butik i faa grupperede queries i stedet for 4 pr. butik (N+1).
  // Stempler bruger den denormaliserede Stamp.businessId (indekseret) til baade
  // sum og seneste aktivitet; kortholdere grupperes pr. kort og mappes til butik;
  // indloesninger taelles pr. butik via join (Redemption har ingen businessId).
  const businessIds = businesses.map((b) => b.id);
  const cardToBiz = new Map<string, string>();
  for (const b of businesses) for (const c of b.cards) cardToBiz.set(c.id, b.id);
  const cardIds = [...cardToBiz.keys()];
  const since7 = new Date();
  since7.setTime(since7.getTime() - 7 * 86_400_000);

  const [stampAgg, cardCounts, newCardCounts, redemptionRows] =
    await Promise.all([
    prisma.stamp.groupBy({
      by: ["businessId"],
      where: { businessId: { in: businessIds } },
      _sum: { multiplier: true },
      _max: { createdAt: true },
    }),
    prisma.customerCard.groupBy({
      by: ["cardId"],
      where: { cardId: { in: cardIds } },
      _count: { _all: true },
    }),
    // Udvikling: nye kortholdere pr. butik de seneste 7 dage.
    prisma.customerCard.groupBy({
      by: ["cardId"],
      where: { cardId: { in: cardIds }, createdAt: { gte: since7 } },
      _count: { _all: true },
    }),
    businessIds.length
      ? prisma.$queryRaw<{ businessId: string; count: number }[]>(Prisma.sql`
          SELECT c."businessId" AS "businessId", COUNT(*)::int AS count
          FROM "Redemption" r
          JOIN "CustomerCard" cc ON cc."id" = r."customerCardId"
          JOIN "Card" c ON c."id" = cc."cardId"
          WHERE c."businessId" IN (${Prisma.join(businessIds)})
          GROUP BY c."businessId"
        `)
      : Promise.resolve([] as { businessId: string; count: number }[]),
  ]);

  const stampsByBiz = new Map<string, number>();
  const lastByBiz = new Map<string, Date | null>();
  for (const g of stampAgg) {
    if (!g.businessId) continue;
    stampsByBiz.set(g.businessId, g._sum.multiplier ?? 0);
    lastByBiz.set(g.businessId, g._max.createdAt ?? null);
  }
  const customersByBiz = new Map<string, number>();
  for (const g of cardCounts) {
    const biz = cardToBiz.get(g.cardId);
    if (biz) {
      customersByBiz.set(biz, (customersByBiz.get(biz) ?? 0) + g._count._all);
    }
  }
  const newByBiz = new Map<string, number>();
  for (const g of newCardCounts) {
    const biz = cardToBiz.get(g.cardId);
    if (biz) newByBiz.set(biz, (newByBiz.get(biz) ?? 0) + g._count._all);
  }
  const redemptionsByBiz = new Map<string, number>();
  for (const r of redemptionRows) {
    redemptionsByBiz.set(r.businessId, Number(r.count));
  }

  const rows = businesses.map((b) =>
    buildRow(b, {
      customers: customersByBiz.get(b.id) ?? 0,
      newCustomers7d: newByBiz.get(b.id) ?? 0,
      stamps: stampsByBiz.get(b.id) ?? 0,
      redemptions: redemptionsByBiz.get(b.id) ?? 0,
      lastActive: lastByBiz.get(b.id) ?? null,
    }),
  );
  const real = rows.filter((r) => !r.isDemo);
  const demo = rows.find((r) => r.isDemo) ?? null;

  // Demo-hentninger pr. dag, seneste 7 dage. Kun demo-butikkens kort, kun de
  // sidste 7 dage (indeks paa [cardId, createdAt]), saa det er en let query.
  const demoBiz = businesses.find((b) => b.slug === DEMO_SLUG);
  let demoSeries: { label: string; count: number; sublabel: string }[] | null =
    null;
  let demo7Total = 0;
  if (demoBiz && demoBiz.cards.length) {
    const since = new Date();
    since.setUTCHours(12, 0, 0, 0);
    since.setTime(since.getTime() - 7 * 86_400_000);
    const events = await prisma.customerCard.findMany({
      where: {
        cardId: { in: demoBiz.cards.map((c) => c.id) },
        createdAt: { gte: since },
      },
      select: { createdAt: true },
    });
    demoSeries = buildDemoSeries(events.map((e) => e.createdAt));
    demo7Total = demoSeries.reduce((a, d) => a + d.count, 0);
  }

  // Noegletal taeller KUN rigtige butikker. Demo-forsoeg holdes helt adskilt, saa
  // "kunder" er rigtige kunder, ikke folk der har prøvet demoen.
  const totals = real.reduce(
    (a, r) => ({
      businesses: a.businesses + 1,
      customers: a.customers + r.customers,
      stamps: a.stamps + r.stamps,
      redemptions: a.redemptions + r.redemptions,
    }),
    { businesses: 0, customers: 0, stamps: 0, redemptions: 0 },
  );

  const stat = [
    { label: "Butikker", value: totals.businesses },
    { label: "Kortholdere", value: totals.customers },
    { label: "Stempler", value: totals.stamps },
    { label: "Indløsninger", value: totals.redemptions },
  ];

  return (
    <AdminShell admin={admin} codeLock={codeLock} active="overblik">
      <div className="flex flex-col gap-10">
        {/* Advarsel: kode-laasen er ikke slaaet til endnu. */}
        {!codeLock ? (
          <div className="rounded-lg border border-rust/30 bg-rust/5 px-5 py-4">
            <p className="font-[400] text-[0.85rem] text-rust">
              Ekstra kode-lås er ikke aktiv endnu.
            </p>
            <p className="mt-1 font-[300] text-[0.82rem] leading-relaxed text-stone">
              Sæt miljøvariablen{" "}
              <span className="font-mono text-ink">ADMIN_ACCESS_CODE</span> til en
              hemmelig kode (kun du kender den) i Vercel, så kræves koden ud over
              email-login for at åbne admin. Lige nu er adgangen kun beskyttet af
              dit email-login.
            </p>
          </div>
        ) : null}

        {/* ── Overblik: noegletal (kun rigtige butikker) ─────────────────── */}
        <section>
          <SectionHead
            title="Overblik"
            desc="Nøgletal på tværs af rigtige butikker. Demo-forsøg tælles for sig, så tallene er skarpe."
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stat.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-fog bg-white p-5 shadow-card"
              >
                <p className="text-[0.66rem] font-[400] uppercase tracking-[0.14em] text-slate">
                  {s.label}
                </p>
                <p className="mt-2 font-[300] text-[1.8rem] tabular-nums text-ink">
                  {formatDkNumber(s.value)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Demo-forsoeg ("Proev det selv") ────────────────────────────── */}
        <section>
          <SectionHead
            title={'Demo-forsøg ("Prøv det selv")'}
            desc="Folk der har hentet demo-kortet på stemplet.alius.dk. De er ikke rigtige kunder og tæller ikke med i Overblik."
          />
          <div className="mt-4 rounded-lg border border-fog bg-white p-5 shadow-card">
            {demo ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-x-10 gap-y-3">
                    <MiniStat
                      label="Hentet i alt"
                      value={formatDkNumber(demo.customers)}
                    />
                    <MiniStat
                      label="Seneste 7 dage"
                      value={formatDkNumber(demo7Total)}
                    />
                    <MiniStat
                      label="Sidste aktivitet"
                      value={
                        demo.lastActive
                          ? formatDkDateTime(demo.lastActive)
                          : "Ingen"
                      }
                    />
                  </div>
                  <ClearDemoButton count={demo.customers} />
                </div>

                {demoSeries ? (
                  <div className="mt-7 border-t border-fog pt-5">
                    <p className="mb-4 text-[0.64rem] font-[500] uppercase tracking-[0.12em] text-slate">
                      Hentninger pr. dag, seneste 7 dage
                    </p>
                    <BarChart data={demoSeries} className="max-w-xl" />
                  </div>
                ) : null}
              </>
            ) : (
              <p className="font-[300] text-[0.9rem] text-slate">
                Ingen demo-butik fundet.
              </p>
            )}
          </div>
        </section>

        {/* ── Butikker: rigtige tilmeldinger + styring + fakturering ──────── */}
        <section>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionHead
              title={`Butikker (${real.length})`}
              desc="Alle rigtige tilmeldinger. Brug knapperne øverst til at se hvad der kræver handling, søg efter en butik, og styr plan, pris og fakturering pr. butik."
            />
            <a
              href="/admin/export"
              className="shrink-0 text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-terracotta transition-colors hover:text-terracotta-dark"
            >
              Eksportér kontakter (CSV)
            </a>
          </div>
          {real.length === 0 ? (
            <p className="mt-4 rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
              Ingen rigtige tilmeldinger endnu. De dukker op her, saa snart en
              butik opretter sig, med ejerens email til at skrive til dem.
            </p>
          ) : (
            <AdminBusinesses rows={real} />
          )}
        </section>
      </div>
    </AdminShell>
  );
}
