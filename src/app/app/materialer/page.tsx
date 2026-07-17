import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading, Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Materialer" };
export const dynamic = "force-dynamic";

const MATERIALS = [
  {
    title: "A4-plakat",
    body: "Til opslagstavlen eller vinduet.",
    href: "/api/materials/plakat",
  },
  {
    title: "A5-skilt",
    body: "Mellemstort skilt til disken eller væggen.",
    href: "/api/materials/a5",
  },
  {
    title: "A6-diskskilt",
    body: "Lille skilt til at stå ved kassen.",
    href: "/api/materials/skilt",
  },
  {
    title: "Visitkort",
    body: "Til hånden eller ved betalingen. 85 x 55 mm.",
    href: "/api/materials/visitkort",
  },
] as const;

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
      <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}

export default async function MaterialerPage() {
  const { business } = await requireBusiness();
  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });
  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qr = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
  const showPoweredBy = PLAN_LIMITS[business.plan].showPoweredBy;

  return (
    <>
      <PageHeading
        title="Materialer"
        subtitle="Print et færdigt skilt med dit eget design, eller download QR-koden og send den til trykkeriet."
        action={
          <Link
            href="/app/kort"
            className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-terracotta hover:opacity-70"
          >
            Rediger design
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Dit design: samme kort-preview som paa Design-siden */}
        <Panel>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
              Dit design
            </span>
            <Link
              href="/app/kort"
              className="text-[0.72rem] font-[300] text-terracotta hover:opacity-70"
            >
              Rediger
            </Link>
          </div>
          <div className="mt-5 flex justify-center">
            <StampCard
              businessName={business.name}
              logoUrl={business.logoUrl}
              primaryColor={business.primaryColor}
              textColor={business.textColor}
              stampIcon={(card?.stampIcon as StampIconKey) ?? "coffee"}
              stamps={Math.min(3, card?.stampsRequired ?? 10)}
              required={card?.stampsRequired ?? 10}
              rewardText={card?.rewardText ?? "10. kop er gratis"}
              showPoweredBy={showPoweredBy}
              serial="STEMPLET01"
              serialLabel={business.name}
              className="max-w-[19rem]"
            />
          </div>
          <p className="mt-5 text-center text-[0.8rem] font-[300] leading-relaxed text-stone">
            Skiltene herunder bruger præcis dette design, dine farver og dit
            logo. Ret det på Design-siden, så følger materialerne med.
          </p>
        </Panel>

        {/* QR-kode: hurtig download til print eller deling */}
        <Panel>
          <span className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
            QR-kode
          </span>
          <div className="mt-5 flex flex-col items-center gap-5">
            <div className="rounded-lg border border-fog bg-white p-3">
              <Image
                src={qr}
                alt="QR til dit stempelkort"
                width={200}
                height={200}
                className="h-44 w-44"
                unoptimized
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <a
                href={qr}
                download={`stemplet-qr-${business.slug}.png`}
                className={btnClass("primary") + " w-full"}
              >
                Download QR (PNG)
              </a>
              <a
                href={cardUrl}
                target="_blank"
                rel="noreferrer"
                className={btnClass("outline") + " w-full"}
              >
                Vis stempelkort
              </a>
              <ShareLinkButton
                businessName={business.name}
                url={cardUrl}
                label="Del stempelkort"
                className="w-full"
              />
            </div>
            <p className="max-w-xs text-center text-[0.74rem] font-[300] leading-relaxed text-slate">
              Send PNG-filen til trykkeriet, eller brug et af de færdige skilte
              herunder, de er klar til print.
            </p>
          </div>
        </Panel>
      </div>

      {/* Faerdige skilte med butikkens design */}
      <div className="mt-8">
        <h2 className="mb-4 text-label font-[400] uppercase tracking-[0.14em] text-slate">
          Færdige skilte, klar til print
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MATERIALS.map((m) => (
            <div
              key={m.title}
              className="flex items-center gap-5 rounded-lg border border-fog bg-white p-6 shadow-card"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                <IconDoc />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-[400] text-[1rem] text-ink">{m.title}</h3>
                <p className="mt-0.5 font-[300] text-[0.84rem] leading-relaxed text-stone">
                  {m.body}
                </p>
              </div>
              <a
                href={m.href}
                target="_blank"
                rel="noopener"
                className={btnClass("outline")}
              >
                Hent PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
