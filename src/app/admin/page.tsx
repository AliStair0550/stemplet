import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSuperadminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { DEMO_SLUG } from "@/lib/demo";
import { formatDkNumber, formatDkDate, formatDkDateTime } from "@/lib/utils";
import {
  CopyEmail,
  PlanSelect,
  DeleteButton,
  ClearDemoButton,
} from "./AdminControls";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

type Owner = { email: string; name: string | null; verified: boolean };
type Row = {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "PRO";
  category: string | null;
  createdAt: Date;
  termsAcceptedAt: Date | null;
  stripeCustomerId: string | null;
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
};

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
  users: { email: string; name: string | null; emailVerified: Date | null }[];
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
    stripeCustomerId: b.stripeCustomerId,
    hasLocation: b.latitude != null && b.longitude != null,
    selfScan: b.selfScanEnabled,
    welcomeStamp: b.welcomeStampEnabled,
    weeklyEmail: b.weeklyEmailEnabled,
    owners: b.users.map((u) => ({
      email: u.email,
      name: u.name,
      verified: u.emailVerified != null,
    })),
    customers,
    stamps,
    redemptions,
    lastActive: lastStamp?.createdAt ?? null,
    isDemo: b.slug === DEMO_SLUG,
  };
}

export default async function AdminPage() {
  // Kun superadmin (SUPERADMIN_EMAIL). Alle andre faar 404, saa siden ikke
  // engang roeber, at den findes.
  const admin = await getSuperadminEmail();
  if (!admin) notFound();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: { select: { email: true, name: true, emailVerified: true } },
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
    { label: "Kunder", value: totals.customers },
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
          <Link
            href="/app"
            className="text-[0.78rem] font-[400] uppercase tracking-[0.1em] text-moss transition-colors hover:text-moss-light"
          >
            Til dashboard
          </Link>
        </div>

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
                Tæller ikke med i {'"'}Kunder{'"'} ovenfor.
              </p>
            </div>
            <ClearDemoButton count={demo.customers} />
          </div>
        ) : null}

        {/* Tilmeldinger: rigtige butikker med kontaktinfo + styring */}
        <h2 className="mt-10 font-[400] text-[0.72rem] uppercase tracking-[0.14em] text-slate">
          Tilmeldinger ({real.length})
        </h2>

        <div className="mt-4 flex flex-col gap-4">
          {real.map((r) => (
            <BusinessCard key={r.id} r={r} />
          ))}
        </div>

        {real.length === 0 ? (
          <p className="mt-4 rounded-lg border border-fog bg-white p-6 font-[300] text-[0.9rem] text-slate shadow-card">
            Ingen rigtige tilmeldinger endnu. De dukker op her, saa snart en butik
            opretter sig, med ejerens email til at skrive til dem.
          </p>
        ) : null}
      </div>
    </main>
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

function BusinessCard({ r }: { r: Row }) {
  return (
    <div className="rounded-lg border border-fog bg-white p-5 shadow-card">
      {/* Titel + plan + slet */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-[400] text-[1.05rem] text-ink">{r.name}</span>
            <Link
              href={`/k/${r.slug}`}
              className="font-[300] text-[0.78rem] text-slate underline-offset-2 hover:text-ink hover:underline"
            >
              /{r.slug}
            </Link>
          </div>
          <p className="mt-1 font-[300] text-[0.76rem] text-slate">
            Oprettet {formatDkDate(r.createdAt)}
            {r.termsAcceptedAt
              ? ` · Vilkår accepteret ${formatDkDate(r.termsAcceptedAt)}`
              : " · Vilkår ikke registreret"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlanSelect businessId={r.id} plan={r.plan} />
          <DeleteButton businessId={r.id} name={r.name} />
        </div>
      </div>

      {/* Kontaktinfo (til at skrive til dem) */}
      <div className="mt-4 rounded-md border border-fog bg-sand/40 px-4 py-3">
        <p className="text-[0.6rem] font-[500] uppercase tracking-[0.12em] text-slate">
          Ejer / kontakt
        </p>
        {r.owners.length ? (
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {r.owners.map((o) => (
              <li
                key={o.email}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.85rem]"
              >
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
        <Metric label="Kunder" value={formatDkNumber(r.customers)} />
        <Metric label="Stempler" value={formatDkNumber(r.stamps)} />
        <Metric label="Indløst" value={formatDkNumber(r.redemptions)} />
        <Metric
          label="Sidst aktiv"
          value={r.lastActive ? formatDkDateTime(r.lastActive) : "Ingen"}
        />
      </div>

      {/* Indstillinger */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-fog pt-3">
        <Fact label="Branche" value={r.category || "-"} />
        <Fact label="Placering" value={r.hasLocation ? "Ja" : "Nej"} />
        <Fact label="Selvscan" value={r.selfScan ? "Til" : "Fra"} />
        <Fact label="Velkomststempel" value={r.welcomeStamp ? "Til" : "Fra"} />
        <Fact label="Ugebrev" value={r.weeklyEmail ? "Til" : "Fra"} />
        <Fact label="Stripe" value={r.stripeCustomerId ? "Ja" : "-"} />
      </div>
    </div>
  );
}
