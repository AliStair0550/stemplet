import Link from "next/link";
import { cn } from "@/lib/utils";

// Kommunikation: maaderne, butikken taler med kunderne paa. Kampagner kraever
// stempler. Nyhedsmail er kun en fane her (ikke i menuen), indtil den er bygget.
export function KommunikationTabs({
  active,
  showCampaigns,
}: {
  active: "beskeder" | "kampagner" | "tilbud" | "nyhedsmail";
  showCampaigns: boolean;
}) {
  const tabs = [
    { key: "beskeder", href: "/app/beskeder", label: "Pushbeskeder" },
    ...(showCampaigns ? [{ key: "kampagner", href: "/app/kampagner", label: "Kampagner" } as const] : []),
    { key: "tilbud", href: "/app/tilbud", label: "Tilbud" },
    { key: "nyhedsmail", href: "/app/nyhedsmail", label: "Nyhedsmail" },
  ] as const;
  return (
    <nav aria-label="Kommunikation" className="mb-6 flex w-fit max-w-full overflow-x-auto rounded-full bg-[#F2F5F9] p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={active === t.key ? "page" : undefined}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[0.88rem]",
            active === t.key ? "bg-ink font-semibold text-white" : "text-stone hover:text-ink",
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
