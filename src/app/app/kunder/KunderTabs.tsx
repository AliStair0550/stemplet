import Link from "next/link";
import { cn } from "@/lib/utils";

// Kunder, Pushbeskeder og Kampagner hoerer sammen: det er maaderne, man taler med
// kunderne og giver dem en grund til at komme igen. Kampagner kraever stempler.
export function KunderTabs({
  active,
  showCampaigns,
}: {
  active: "kunder" | "beskeder" | "kampagner";
  showCampaigns: boolean;
}) {
  const tabs = [
    { key: "kunder", href: "/app/kunder", label: "Kunder" },
    { key: "beskeder", href: "/app/beskeder", label: "Pushbeskeder" },
    ...(showCampaigns ? [{ key: "kampagner", href: "/app/kampagner", label: "Kampagner" } as const] : []),
  ] as const;
  return (
    <nav aria-label="Kunder" className="mb-6 flex w-fit rounded-full bg-[#F2F5F9] p-1">
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
