import Link from "next/link";
import { cn } from "@/lib/utils";

// Kunder og Kampagner hoerer sammen: kampagner er maaden, man giver kunderne en
// grund til at komme igen. Kampagner kraever stempler, saa uden dem ingen faner.
export function KunderTabs({ active, showCampaigns }: { active: "kunder" | "kampagner"; showCampaigns: boolean }) {
  if (!showCampaigns) return null;
  const tabs = [
    { key: "kunder", href: "/app/kunder", label: "Kunder" },
    { key: "kampagner", href: "/app/kampagner", label: "Kampagner" },
  ] as const;
  return (
    <nav aria-label="Kunder" className="mb-6 flex w-fit rounded-full bg-[#f5f5f7] p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-2 text-[0.88rem]",
            active === t.key ? "bg-ink font-semibold text-white" : "text-stone hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
