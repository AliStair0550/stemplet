"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";

function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1.05rem] w-[1.05rem]"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 17.5M15.4 6.5 8.6 10.5" />
    </svg>
  );
}

// Genbrugelig deleknap: native deling af et link (fx tilmeldings-siden) med
// kopier-link som fallback. Deles linket, viser previewet stempelkortet (OG).
export function ShareLinkButton({
  businessName,
  url,
  label = "Del kortet",
  className,
}: {
  businessName: string;
  url: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = `Hent dit digitale stempelkort hos ${businessName}. Ingen app, ingen tilmelding.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Stempelkort hos ${businessName}`,
          text,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // brugeren annullerede, eller deling er ikke understoettet
    }
  }

  return (
    <button
      onClick={share}
      className={cn(btnClass("outline", "md"), "gap-2", className)}
    >
      <ShareIcon />
      {copied ? "Link kopieret" : label}
    </button>
  );
}
