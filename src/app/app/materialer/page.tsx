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
import { MaterialsPrint } from "./MaterialsPrint";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";

export const metadata: Metadata = { title: "Materialer" };
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
        title="Materialer"
        subtitle="Print et færdigt skilt i dit eget design, eller download QR-koden og send den til trykkeriet."
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
            Skiltene bruger dine farver og de samme stempler. Ret designet på
            Design-siden, så følger materialerne med.
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
              Send PNG-filen til trykkeriet for et skilt i høj kvalitet, eller
              print et af de færdige skilte herunder med det samme.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-8">
        <MaterialsPrint />
      </div>
    </>
  );
}
