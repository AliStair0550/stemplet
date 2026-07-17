import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSuperadminEmail,
  isAdminUnlocked,
  adminCodeConfigured,
} from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";
import { effectiveProPriceKr } from "@/lib/billing";
import { formatDkNumber, formatDkDateTime } from "@/lib/utils";
import { AdminUnlock } from "./AdminUnlock";
import { ClearDemoButton, LockButton } from "./AdminControls";
import { AdminBusinesses, type Row } from "./AdminBusinesses";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

async function buildRow(b: {
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
  users: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: Date | null;
  }[];
  cards: { id: string }[];
}): Promise<Row> {
  const cardIds = b.cards.map((c) => c.id);
  const where = { customerCard: { cardId: { in: cardIds } } };
  const [customers, stamps, redemptions, lastStamp] = await Promise.all([
    prisma.customerCard.count({ where: { cardId: { in: cardIds } } }),
    cardIds.length ? prisma.stamp.count({ where }) : Promise.resolve(0),
    cardIds.length ? prisma.redemption.count({ where }) : Promise.resolve(0),
    cardIds.length
      ? prisma.stamp.findFirst({
          where,
          orderBy: { createdAt: "desc" },
          select: { createdAt: true },
        })
      : Promise.resolve(null),
  ]);
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
    owners: b.users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      verified: u.emailVerified != null,
    })),
    customers,
    stamps,
    redemptions,
    lastActive: lastStamp?.createdAt ?? null,
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
      users: {
        select: { id: true, email: true, name: true, emailVerified: true },
      },
      cards: { select: { id: true } },
    },
  });

  const rows = await Promise.all(businesses.map(buildRow));
  const real = rows.filter((r) => !r.isDemo);
  const demo = rows.find((r) => r.isDemo) ?? null;

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
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[300] text-[1.6rem] tracking-[0.02em] text-ink">
              Platform-overblik
            </h1>
            <p className="mt-1 font-[300] text-[0.85rem] text-slate">
              Logget ind som {admin}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <a
              href="/admin/export"
              className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-terracotta transition-colors hover:text-terracotta-dark"
            >
              Eksportér kontakter (CSV)
            </a>
            {codeLock ? <LockButton /> : null}
            <Link
              href="/app"
              className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
            >
              Til dashboard
            </Link>
          </div>
        </div>

        {/* Advarsel: kode-laasen er ikke slaaet til endnu. */}
        {!codeLock ? (
          <div className="mt-6 rounded-lg border border-rust/30 bg-rust/5 px-5 py-4">
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

        {/* Noegletal (kun rigtige butikker, demo ekskluderet) */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
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

        {/* Demo-forsoeg: helt adskilt fra rigtige kunder, saa tallene er skarpe. */}
        {demo ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fog bg-sand/50 px-5 py-4">
            <div>
              <p className="text-[0.66rem] font-[500] uppercase tracking-[0.14em] text-slate">
                Demo-forsøg ({'"'}Prøv det selv{'"'})
              </p>
              <p className="mt-1 font-[300] text-[0.9rem] text-stone">
                <span className="font-[400] tabular-nums text-ink">
                  {formatDkNumber(demo.customers)}
                </span>{" "}
                personer har hentet demo-kortet.{" "}
                {demo.lastActive
                  ? `Sidste aktivitet ${formatDkDateTime(demo.lastActive)}.`
                  : ""}{" "}
                Tæller ikke med i {'"'}Kortholdere{'"'} ovenfor.
              </p>
            </div>
            <ClearDemoButton count={demo.customers} />
          </div>
        ) : null}

        {/* Tilmeldinger: rigtige butikker med kontaktinfo + styring */}
        <h2 className="mt-10 font-[400] text-[0.72rem] uppercase tracking-[0.14em] text-slate">
          Tilmeldinger ({real.length})
        </h2>

        {real.length === 0 ? (
          <p className="mt-4 rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
            Ingen rigtige tilmeldinger endnu. De dukker op her, saa snart en butik
            opretter sig, med ejerens email til at skrive til dem.
          </p>
        ) : (
          <AdminBusinesses rows={real} />
        )}
      </div>
    </main>
  );
}
