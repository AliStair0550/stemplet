import Link from "next/link";
import { cn } from "@/lib/utils";

// Kommunikation: maaderne, butikken taler med kunderne paa. Kampagner kraever
// stempler. (Nyhedsmail kommer tilbage som fane, naar den er bygget.)
export function KommunikationTabs({
  active,
  showCampaigns,
}: {
  active: "beskeder" | "kampagner" | "tilbud";
  showCampaigns: boolean;
}) {
  const tabs = [
    { key: "beskeder", href: "/app/beskeder", label: "Pushbeskeder", short: "Push" },
    ...(showCampaigns ? [{ key: "kampagner", href: "/app/kampagner", label: "Kampagner", short: "Kampagner" } as const] : []),
    { key: "tilbud", href: "/app/tilbud", label: "Tilbud", short: "Tilbud" },
  ] as const;
  // Paa telefonen fylder fanerne bredden med korte navne, saa alle kan ses
  // (ingen afskaaret fane, man skal scrolle efter).
  return (
    <nav aria-label="Kommunikation" className="mb-6 flex w-full rounded-full bg-[#F2F5F9] p-1 sm:w-fit">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "flex-1 whitespace-nowrap rounded-full px-2 py-2 text-center text-[0.85rem] sm:flex-none sm:px-4 sm:text-[0.88rem]",
            active === t.key ? "bg-ink font-semibold text-white" : "text-stone hover:text-ink",
          )}
        >
          <span className="sm:hidden">{t.short}</span>
          <span className="hidden sm:inline">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}
