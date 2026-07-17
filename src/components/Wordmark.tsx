import Link from "next/link";
import { cn } from "@/lib/utils";

// Stemplets ordmaerke: "Stemplet" i Instrument Sans Bold, hvor punktummet er en
// rust prik (selve stemplet). Rendret som tekst + CSS-prik, ikke billede: skarpt
// paa alle skaerme, korrekt farve paa moerke flader, ingen ekstra download.
// Prik = 29% af font-size, paa grundlinjen, margin-left 10% af font-size.
export function Wordmark({
  href = "/",
  className,
  tone = "ink",
}: {
  href?: string;
  className?: string;
  tone?: "ink" | "light";
}) {
  return (
    <Link
      href={href}
      aria-label="Stemplet, forside"
      className={cn(
        "inline-flex items-baseline text-[1.1rem] font-bold leading-none tracking-[-0.045em]",
        tone === "light" ? "text-parchment" : "text-ink",
        className,
      )}
    >
      Stemplet
      <span
        aria-hidden
        className="ml-[0.1em] inline-block rounded-full bg-terracotta"
        style={{ width: "0.29em", height: "0.29em" }}
      />
    </Link>
  );
}
