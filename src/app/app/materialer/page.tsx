import type { Metadata } from "next";
import Image from "next/image";
import QRCode from "qrcode";
import { requireBusiness } from "@/lib/session";
import { APP_URL } from "@/lib/env";
import { PageHeading, Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";

export const metadata: Metadata = { title: "Materialer" };
export const dynamic = "force-dynamic";

export default async function MaterialerPage() {
  const { business } = await requireBusiness();
  const cardUrl = `${APP_URL}/k/${business.slug}`;
  const qr = await QRCode.toDataURL(cardUrl, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return (
    <>
      <PageHeading
        title="Materialer"
        subtitle="Print en QR til disken. Kunder scanner og får deres kort."
      />
      <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
        <Panel className="flex flex-col items-center gap-4">
          <Image
            src={qr}
            alt="QR til dit stempelkort"
            width={200}
            height={200}
            className="h-48 w-48"
            unoptimized
          />
          <span className="break-all text-center text-[0.78rem] font-[200] text-slate">
            {cardUrl}
          </span>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
              A4-plakat
            </h2>
            <p className="mt-2 font-[200] text-[0.85rem] leading-relaxed text-stone">
              Til opslagstavlen eller vinduet.
            </p>
            <a
              href="/api/materials/plakat"
              target="_blank"
              rel="noopener"
              className={btnClass("primary") + " mt-4"}
            >
              Hent plakat (PDF)
            </a>
          </Panel>
          <Panel>
            <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
              A6-diskskilt
            </h2>
            <p className="mt-2 font-[200] text-[0.85rem] leading-relaxed text-stone">
              Lille skilt til at stå ved kassen.
            </p>
            <a
              href="/api/materials/skilt"
              target="_blank"
              rel="noopener"
              className={btnClass("primary") + " mt-4"}
            >
              Hent diskskilt (PDF)
            </a>
          </Panel>
        </div>
      </div>
    </>
  );
}
