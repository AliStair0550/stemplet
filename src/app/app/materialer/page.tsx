import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/env";
import { PageHeading, Panel, SectionHeader } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { StampCard } from "@/components/StampCard";
import { cardTitle } from "@/lib/brand";
import { ShareLinkButton } from "@/components/ShareLinkButton";
import { QrPrintPanel } from "./QrPrintPanel";
import { MaterialsPrint } from "./MaterialsPrint";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Del dit kort" };
export const dynamic = "force-dynamic";

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
        title="Del dit kort"
        subtitle="Få kunderne i gang med stempelkortet: hent QR-koden, print et færdigt skilt i dit design, eller del linket online."
      />

      <div className="flex flex-col gap-10">
        {/* 1. QR-koden: den ene ting alt andet peger paa. Download til trykkeri
            eller send-linket, plus et kig paa kundens side. */}
        <section>
          <SectionHeader title="QR-kode" />
          <Panel>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="mx-auto shrink-0 rounded-lg border border-fog bg-white p-3 sm:mx-0">
                <Image
                  src={qr}
                  alt="QR til dit stempelkort"
                  width={200}
                  height={200}
                  className="h-40 w-40"
                  unoptimized
                />
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <p className="max-w-md font-[300] text-[0.9rem] leading-relaxed text-stone">
                  Kunderne scanner koden med kameraet og henter kortet med det
                  samme. Download PNG-filen til trykkeriet, eller print et
                  færdigt skilt herunder.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <a
                    href={qr}
                    download={`stemplet-qr-${business.slug}.png`}
                    className={btnClass("primary")}
                  >
                    Download QR-kode
                  </a>
                  <a
                    href={cardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={btnClass("outline")}
                  >
                    Se kundens side
                  </a>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* 2. Print QR-koden: den faerdige, previewede QR i dit design
            (visitkort + A4-plakat). Den staerke print-oplevelse. */}
        <section>
          <SectionHeader title="Print QR-koden" />
          <QrPrintPanel
            slug={business.slug}
            cardUrl={cardUrl}
            qrDataUrl={qr}
            businessName={cardTitle(business)}
            primaryColor={business.primaryColor}
            textColor={business.textColor}
            logoUrl={business.logoUrl}
          />
        </section>

        {/* 3. Flere skilte: mellemstoerrelser med tomt stempel-gitter, tilpasses
            eet sted. */}
        <section>
          <SectionHeader title="Skilte til disk og væg" />
          <MaterialsPrint />
        </section>

        {/* 4. Del online: kortet som kunderne ser det, med et delelink til
            Instagram, Facebook eller din bio. */}
        <section>
          <SectionHeader title="Del kortet online" />
          <Panel>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="mx-auto shrink-0 sm:mx-0">
                <StampCard
                  businessName={cardTitle(business)}
                  logoUrl={business.logoUrl}
                  logoScale={business.logoScale}
                  primaryColor={business.primaryColor}
                  textColor={business.textColor}
                  stampIcon={(card?.stampIcon as StampIconKey) ?? "coffee"}
                  stamps={Math.min(3, card?.stampsRequired ?? 10)}
                  required={card?.stampsRequired ?? 10}
                  rewardText={card?.rewardText ?? "10. kop er gratis"}
                  showPoweredBy={showPoweredBy}
                  serial="STEMPLET01"
                  serialLabel={business.name}
                  className="w-full max-w-[22rem]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4">
                <p className="max-w-md font-[300] text-[0.9rem] leading-relaxed text-stone">
                  Sådan ser kortet ud for kunderne. Del linket på Instagram,
                  Facebook eller i din bio, så folk kan hente det hjemmefra.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <ShareLinkButton
                    businessName={cardTitle(business)}
                    url={cardUrl}
                    label="Del kortet"
                  />
                  <Link href="/app/kort" className={btnClass("outline")}>
                    Rediger design
                  </Link>
                </div>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </>
  );
}
