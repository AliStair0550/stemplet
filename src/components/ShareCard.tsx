"use client";

import { StampCard } from "@/components/StampCard";
import type { CardDesign } from "@/components/CardDesigner";

// Delbart, socialt-klar billede: kortet + en QR, kunderne kan scanne. Bruges
// til at eksportere en PNG fra kortdesigneren.
export function ShareCard({
  design,
  businessName,
  qrDataUrl,
}: {
  design: CardDesign;
  businessName: string;
  qrDataUrl: string;
}) {
  return (
    <div className="flex w-[560px] flex-col items-center gap-9 bg-parchment px-12 py-14">
      <div className="text-center">
        <p className="text-[0.7rem] font-[400] uppercase tracking-[0.18em] text-moss">
          Nyt stempelkort
        </p>
        <h3 className="mt-2 font-fraunces text-[1.9rem] font-light italic leading-tight text-ink">
          {businessName}
        </h3>
      </div>

      <StampCard
        businessName={businessName}
        logoUrl={design.logoUrl}
        primaryColor={design.primaryColor}
        textColor={design.textColor}
        stampIcon={design.stampIcon}
        stamps={Math.min(4, design.stampsRequired)}
        required={design.stampsRequired}
        rewardText={design.rewardText}
      />

      <div className="flex items-center gap-5">
        {/* Plain <img> (ikke next/image), saa html-to-image kan indlejre QR'en. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt=""
          width={96}
          height={96}
          className="h-24 w-24 rounded-md bg-white p-1.5 ring-1 ring-fog"
        />
        <div className="max-w-[230px]">
          <p className="font-[400] text-[1.05rem] leading-snug text-ink">
            Scan og få dit kort
          </p>
          <p className="mt-1 font-[200] text-[0.88rem] leading-relaxed text-stone">
            På fem sekunder. Ingen app, ingen tilmelding.
          </p>
        </div>
      </div>
    </div>
  );
}
