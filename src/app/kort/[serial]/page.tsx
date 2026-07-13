import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { loadCardBySerial } from "@/lib/stamp";
import { StampCard } from "@/components/StampCard";
import { LiveRefresh } from "@/components/LiveRefresh";
import { WebCardActions } from "./WebCardActions";
import { WALLET_ENABLED } from "@/lib/env";
import { PLAN_LIMITS } from "@/lib/plans";
import type { StampIconKey } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Metadata> {
  const { serial } = await params;
  const cc = await loadCardBySerial(serial);
  return {
    title: cc ? `Dit kort hos ${cc.card.business.name}` : "Stempelkort",
    robots: { index: false },
  };
}

export async function generateViewport({
  params,
}: {
  params: Promise<{ serial: string }>;
}): Promise<Viewport> {
  const { serial } = await params;
  const cc = await loadCardBySerial(serial);
  return { themeColor: cc?.card.business.primaryColor ?? "#FAF8F4" };
}

export default async function WebCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ serial: string }>;
  searchParams: Promise<{ vis?: string }>;
}) {
  const { serial } = await params;
  const { vis } = await searchParams;
  const cc = await loadCardBySerial(serial);
  if (!cc) notFound();

  const business = cc.card.business;
  const showPoweredBy = PLAN_LIMITS[business.plan].showPoweredBy;
  const rewardReady = cc.stamps >= cc.card.stampsRequired;

  // Kortets egen QR (personalet scanner den i scan-modus / ved indløsning).
  const serialQr = await QRCode.toDataURL(serial, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });

  return (
    <main className="flex min-h-screen flex-col items-center bg-parchment px-6 py-12">
      <LiveRefresh />
      <div className="flex w-full max-w-sm flex-col items-center gap-6">
        <StampCard
          businessName={business.name}
          logoUrl={business.logoUrl}
          primaryColor={business.primaryColor}
          textColor={business.textColor}
          stampIcon={cc.card.stampIcon as StampIconKey}
          stamps={cc.stamps}
          required={cc.card.stampsRequired}
          rewardText={cc.card.rewardText}
          showPoweredBy={showPoweredBy}
          serial={cc.serial}
        />

        {rewardReady ? (
          <div className="w-full rounded-lg border border-moss bg-moss/5 px-5 py-4 text-center">
            <p className="font-[300] text-[1rem] text-ink">
              Din belønning er klar
            </p>
            <p className="mt-1 font-[200] text-[0.82rem] text-stone">
              Vis dette kort ved kassen for at indløse.
            </p>
          </div>
        ) : null}

        <WebCardActions
          serial={cc.serial}
          serialQr={serialQr}
          walletEnabled={WALLET_ENABLED}
          rewardReady={rewardReady}
          openQr={vis === "1"}
        />

        <p className="max-w-xs text-center text-[0.72rem] font-[200] leading-relaxed text-slate">
          Føj kortet til hjemmeskærmen, så har du det altid ved hånden.
        </p>
      </div>
    </main>
  );
}
