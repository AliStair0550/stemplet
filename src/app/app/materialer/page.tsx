import type { Metadata } from "next";
import Image from "next/image";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { ShareCardSection } from "./ShareCardSection";
import type { CardDesign } from "@/components/CardDesigner";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Materialer" };
export const dynamic = "force-dynamic";

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
  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qr = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  const card = await prisma.card.findFirst({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });
  const design: CardDesign = {
    stampsRequired: card?.stampsRequired ?? 10,
    rewardText: card?.rewardText ?? "din belønning",
    stampIcon: (card?.stampIcon ?? "coffee") as StampIconKey,
    primaryColor: business.primaryColor,
    textColor: business.textColor,
    logoUrl: business.logoUrl,
  };

  return (
    <>
      <PageHeading
        title="Materialer"
        subtitle="Print en QR til disken. Kunder scanner og får deres kort."
      />
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        {/* QR til disken */}
        <div className="flex flex-col items-center gap-5 rounded-lg border border-fog bg-white p-8">
          <span className="text-label font-[400] uppercase tracking-[0.14em] text-slate">
            Din QR-kode
          </span>
          <div className="rounded-lg border border-fog p-3">
            <Image
              src={qr}
              alt="QR til dit stempelkort"
              width={200}
              height={200}
              className="h-44 w-44"
              unoptimized
            />
          </div>
          <span className="break-all text-center text-[0.78rem] font-[300] text-slate">
            {cardUrl}
          </span>
        </div>

        {/* Print-materialer */}
        <div className="flex flex-col gap-4">
          {(
            [
              {
                title: "A4-plakat",
                body: "Til opslagstavlen eller vinduet.",
                href: "/api/materials/plakat",
              },
              {
                title: "A6-diskskilt",
                body: "Lille skilt til at stå ved kassen.",
                href: "/api/materials/skilt",
              },
            ] as const
          ).map((m) => (
            <div
              key={m.title}
              className="flex items-center gap-5 rounded-lg border border-fog bg-white p-6"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-moss/10 text-moss">
                <IconDoc />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-[400] text-[1rem] text-ink">{m.title}</h2>
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

      <ShareCardSection
        design={design}
        businessName={business.name}
        slug={business.slug}
        cardUrl={cardUrl}
        qrDataUrl={qr}
      />
    </>
  );
}
