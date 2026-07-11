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
  /** Animer det senest tilføjede stempel (bruges i hero og ved stempling). */
  pop?: boolean;
  /** Blødt lys-sweep henover kortet (bruges i hero for at gøre det levende). */
  shine?: boolean;
  /** Bredere og lavere kort (mere landskab, som et rigtigt Wallet-pass). */
  landscape?: boolean;
  /** Ekstra klasser paa logoet (fx invert til lyst logo paa moerkt kort). */
  logoClassName?: string;
  /** Skjul virksomhedsnavnet (fx naar logoet allerede er et ordmaerke). */
  hideName?: boolean;
  /** Vis en pæn etiket under stregkoden i stedet for det raa serienummer. */
  serialLabel?: string;
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
  shine = false,
  landscape = false,
  logoClassName,
  hideName = false,
  serialLabel,
  className,
}: StampCardProps) {
  const rewardReady = stamps >= required;
  const slots = Array.from({ length: required });
  // Balancerede raekker: 10 stempler bliver 5+5, 8 bliver 4+4 osv.
  const columns = required <= 5 ? required : Math.ceil(required / 2);

  return (
    <div
      className={cn(
        "relative w-full select-none overflow-hidden rounded-[1.4rem] shadow-[0_22px_60px_-14px_rgba(26,26,26,0.45)] ring-1 ring-black/5",
        landscape ? "max-w-md" : "max-w-sm",
        className,
      )}
      style={{ background: primaryColor, color: textColor }}
    >
      {/* blødt top-lys for dybde */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 32%, rgba(0,0,0,0) 62%)",
        }}
      />
      {shine ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/3"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.22) 50%, rgba(255,255,255,0) 100%)",
            animation: "sheenSweep 3.5s ease-in-out 1s infinite",
          }}
        />
      ) : null}
      <div
        className={cn(
          "relative flex flex-col",
          landscape ? "gap-4 p-5" : "gap-5 p-6",
        )}
      >
        {/* Toplinje: logo + tæl */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName}
                width={609}
                height={177}
                className={cn(
                  "h-8 w-auto max-w-[62%] object-contain object-left",
                  logoClassName,
                )}
                unoptimized
              />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-md text-[0.7rem] font-[500]"
                style={{ background: rgba(textColor, 0.14) }}
              >
                {businessName.slice(0, 2).toUpperCase()}
              </div>
            )}
            {!hideName ? (
              <span className="text-[0.82rem] font-[400] tracking-[0.02em]">
                {businessName}
              </span>
            ) : null}
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

        {/* Beløn - teksten forklarer sig selv, ingen label */}
        <div className="flex items-center gap-2">
          {rewardReady ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[0.58rem] font-[500] uppercase tracking-[0.14em]"
              style={{ background: textColor, color: primaryColor }}
            >
              Klar
            </span>
          ) : null}
          <div
            className={cn(
              "text-[1.1rem] font-[300] leading-snug",
              rewardReady && "animate-reward-glow rounded-md",
            )}
          >
            {rewardText}
          </div>
        </div>

        {/* Stempelfelter - balancerede raekker (fx 5+5) */}
        <div
          className={cn("grid w-fit", landscape ? "gap-2" : "gap-2.5")}
          style={{ gridTemplateColumns: `repeat(${columns}, auto)` }}
        >
          {slots.map((_, i) => {
            const filled = i < stamps;
            const chipStyle = filled
              ? {
                  background: textColor,
                  color: primaryColor,
                  boxShadow: "0 3px 8px rgba(0,0,0,0.18)",
                }
              : {
                  background: rgba(textColor, 0.06),
                  color: rgba(textColor, 0.35),
                  border: `1px solid ${rgba(textColor, 0.18)}`,
                };
            return (
              <div
                key={`${i}-${filled}`}
                className={cn(
                  "flex items-center justify-center rounded-full",
                  landscape ? "h-9 w-9" : "h-10 w-10",
                  filled && pop && i === stamps - 1 && "animate-stamp-pop",
                )}
                style={chipStyle}
              >
                <StampIcon
                  icon={stampIcon}
                  className={landscape ? "h-[1.05rem] w-[1.05rem]" : "h-5 w-5"}
                />
              </div>
            );
          })}
        </div>

        {/* Stregkode-strip */}
        {serial ? (
          <div
            className={cn(
              "flex flex-col items-center rounded-lg bg-white px-4",
              landscape ? "gap-1 py-2" : "mt-1 gap-1.5 py-3",
            )}
          >
            <BarcodeGlyph value={serial} compact={landscape} />
            <span
              className={cn(
                "font-[400] text-ink",
                serialLabel ? "tracking-[0.12em]" : "tracking-[0.3em]",
                landscape ? "text-[0.55rem]" : "text-[0.6rem]",
              )}
            >
              {serialLabel ?? serial}
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

/** Simpel dekorativ stregkode-glyph (den rigtige QR står på webkortet). */
function BarcodeGlyph({
  value,
  compact = false,
}: {
  value: string;
  compact?: boolean;
}) {
  const bars = value
    .split("")
    .map((ch) => (ch.charCodeAt(0) % 4) + 1);
  return (
    <div className={cn("flex items-end gap-[2px]", compact ? "h-6" : "h-8")}>
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
