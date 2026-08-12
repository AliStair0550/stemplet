"use client";

import { useState } from "react";
import { StampCard } from "@/components/StampCard";
import { btnClass } from "@/components/ui";
import type { StampIconKey } from "@/lib/brand";

type Props = {
  businessName: string;
  serialLabel: string;
  primaryColor: string;
  textColor: string;
  stampIcon: StampIconKey;
  stampsRequired: number;
  rewardText: string;
  logoUrl: string | null;
  showPoweredBy: boolean;
};

// "Prøv det selv": lad ejeren MAERKE loopet, foer den foerste rigtige kunde.
// Et tryk giver et stempel paa butikkens eget kort (med pop), og belOnningen
// laaser op. Rent klient-side demo, ingen data, saa det ikke roder statistikken.
// Starter et par stempler fra maal, saa der altid er en hurtig vej til
// belOnningen (dopamin).
export function TryStampDemo(props: Props) {
  const required = Math.max(1, props.stampsRequired);
  const start = Math.max(0, required - 3);
  const [stamps, setStamps] = useState(start);
  const full = stamps >= required;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-fog bg-sand/30 p-4">
      <div className="mx-auto w-full max-w-[22rem]">
        <StampCard
          businessName={props.businessName}
          logoUrl={props.logoUrl}
          primaryColor={props.primaryColor}
          textColor={props.textColor}
          stampIcon={props.stampIcon}
          stamps={stamps}
          required={required}
          rewardText={props.rewardText}
          showPoweredBy={props.showPoweredBy}
          serial="STEMPLET01"
          serialLabel={props.serialLabel}
          pop
        />
      </div>

      {full ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-[0.85rem] font-[400] text-terracotta">
            Belønning klar. Sådan bliver et besøg til en fast kunde.
          </p>
          <button
            type="button"
            onClick={() => setStamps(start)}
            className={`${btnClass("outline")} w-full`}
          >
            Prøv igen
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setStamps((s) => Math.min(required, s + 1))}
          className={`${btnClass("primary")} w-full`}
        >
          Giv et stempel
        </button>
      )}

      <p className="text-center text-[0.72rem] font-[300] leading-relaxed text-slate">
        Prøv det selv, sådan føles kassen. Det tæller ikke med i din statistik.
      </p>
    </div>
  );
}
