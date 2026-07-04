import Image from "next/image";
import { StampIcon } from "./StampIcon";
import { hexToRgb, contrastText, type StampIconKey } from "@/lib/brand";
import { cn } from "@/lib/utils";

export type StampCardProps = {
  businessName: string;
  logoUrl?: string | null;
  primaryColor?: string;
  textColor?: string;
  stampIcon?: StampIconKey;
  stamps: number;
  required: number;
  rewardText: string;
  showPoweredBy?: boolean;
  serial?: string;
  /** Animer det senest tilfoejede stempel (bruges i hero og ved stempling). */
  pop?: boolean;
  className?: string;
};

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Tro kopi af Wallet-passet, bygget i HTML/CSS. Bruges i hero, i
 * kortdesigneren (live preview) og som webkort.
 */
export function StampCard({
  businessName,
  logoUrl,
  primaryColor = "#061C3D",
  textColor = "#FFFFFF",
  stampIcon = "coffee",
  stamps,
  required,
  rewardText,
  showPoweredBy = false,
  serial,
  pop = false,
  className,
}: StampCardProps) {
  const rewardReady = stamps >= required;
  const slots = Array.from({ length: required });

  return (
    <div
      className={cn(
        "w-full max-w-sm select-none overflow-hidden rounded-[1.4rem] shadow-[0_18px_50px_-12px_rgba(26,26,26,0.35)] ring-1 ring-black/5",
        className,
      )}
      style={{ background: primaryColor, color: textColor }}
    >
      <div className="flex flex-col gap-5 p-6">
        {/* Toplinje: logo + tael */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName}
                width={36}
                height={36}
                className="h-9 w-9 rounded-md object-contain"
                style={{ background: rgba(textColor, 0.12) }}
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md text-[0.7rem] font-[500]"
                style={{ background: rgba(textColor, 0.14) }}
              >
                {businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="text-[0.82rem] font-[400] tracking-[0.02em]">
              {businessName}
            </span>
          </div>
          <div className="text-right">
            <div
              className="text-[0.55rem] font-[500] uppercase tracking-[0.16em]"
              style={{ color: rgba(textColor, 0.6) }}
            >
              Stempler
            </div>
            <div className="text-[1.05rem] font-[400] tabular-nums leading-tight">
              {Math.min(stamps, required)}/{required}
            </div>
          </div>
        </div>

        {/* Beloenning / status */}
        <div>
          <div
            className="text-[0.55rem] font-[500] uppercase tracking-[0.16em]"
            style={{ color: rgba(textColor, 0.6) }}
          >
            {rewardReady ? "Klar" : "Beloenning"}
          </div>
          <div
            className={cn(
              "text-[1.05rem] font-[300] leading-snug",
              rewardReady && "animate-reward-glow rounded-md",
            )}
          >
            {rewardReady ? "Din beloenning er klar" : rewardText}
          </div>
        </div>

        {/* Stempelfelter */}
        <div className="flex flex-wrap gap-2.5">
          {slots.map((_, i) => {
            const filled = i < stamps;
            const chipStyle = filled
              ? { background: textColor, color: primaryColor }
              : {
                  background: rgba(textColor, 0.06),
                  color: rgba(textColor, 0.35),
                  border: `1px solid ${rgba(textColor, 0.18)}`,
                };
            return (
              <div
                key={`${i}-${filled}`}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full",
                  filled && pop && i === stamps - 1 && "animate-stamp-pop",
                )}
                style={chipStyle}
              >
                <StampIcon icon={stampIcon} className="h-5 w-5" />
              </div>
            );
          })}
        </div>

        {/* Stregkode-strip */}
        {serial ? (
          <div className="mt-1 flex flex-col items-center gap-1.5 rounded-lg bg-white px-4 py-3">
            <BarcodeGlyph value={serial} />
            <span className="text-[0.6rem] font-[400] tracking-[0.3em] text-ink">
              {serial}
            </span>
          </div>
        ) : null}

        {showPoweredBy ? (
          <div
            className="text-center text-[0.6rem] font-[300] tracking-[0.08em]"
            style={{ color: rgba(textColor, 0.5) }}
          >
            Drevet af Stemplet
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Simpel dekorativ stregkode-glyph (den rigtige QR staar paa webkortet). */
function BarcodeGlyph({ value }: { value: string }) {
  const bars = value
    .split("")
    .map((ch) => (ch.charCodeAt(0) % 4) + 1);
  return (
    <div className="flex h-8 items-end gap-[2px]">
      {bars.map((w, i) => (
        <span
          key={i}
          className="bg-ink"
          style={{ width: `${w}px`, height: i % 3 === 0 ? "100%" : "80%" }}
        />
      ))}
    </div>
  );
}
