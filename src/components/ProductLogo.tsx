import { cn } from "@/lib/utils";

// Produkternes logoer i dashboardet. Stemplet: Instrument Sans Bold + rust prik
// (samme maal som Wordmark, men uden link). Henvisninger: haandskrevet ordmaerke
// (public/henvisninger-logo.svg, se scripts/henvisninger-logo.py). Hoejden styres
// med className (fx "h-6"); bredden foelger logoets egne proportioner.
export function StempletLogo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Stemplet"
      className={cn(
        "inline-flex items-baseline font-sans font-bold leading-none tracking-[-0.045em] text-ink",
        className,
      )}
    >
      Stemplet
      <span
        aria-hidden
        // Fast farve (ikke bg-terracotta), saa dashboardets sort/hvide stil aldrig
        // rammer Stemplets prik.
        className="ml-[0.1em] inline-block rounded-full"
        style={{ width: "0.29em", height: "0.29em", backgroundColor: "#a6502e" }}
      />
    </span>
  );
}

export function HenvisningerLogo({
  className,
  tone = "ink",
}: {
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "light" ? "/henvisninger-logo-hvid.svg" : "/henvisninger-logo.svg"}
      alt="Henvisninger"
      className={cn("block w-auto", className)}
    />
  );
}
