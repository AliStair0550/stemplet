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
  tone = "default",
  text,
  onShared,
}: {
  businessName: string;
  url: string;
  label?: string;
  className?: string;
  /** Faerdig besked foran linket (fx butikkens besked til sine kunder). */
  text?: string;
  /** Kaldes, naar linket er delt eller kopieret. */
  onShared?: () => void;
  // "onDark": arver tekstfarven (currentColor) og faar en haarfin ramme, saa
  // knappen passer paa en moerk, brandet flade (fx kortets landingsside).
  // "primary": fyldt hovedknap. "light": hvid knap paa en moerk flade (Kom i gang).
  tone?: "default" | "onDark" | "primary" | "light";
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        // Kun link (og en kort titel). Ingen ekstra brOdtekst: previewet af selve
        // stempelkortet (OG-billedet) fortaeller historien, saa beskeden bliver
        // ren og klikbar.
        await navigator.share({
          title: `Kundekort hos ${businessName}`,
          ...(text ? { text } : {}),
          url,
        });
      } else {
        await navigator.clipboard.writeText(text ? `${text} ${url}` : url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      onShared?.();
    } catch {
      // brugeren annullerede, eller deling er ikke understoettet
    }
  }

  if (tone === "onDark") {
    return (
      <button
        onClick={share}
        style={{ borderColor: "currentColor" }}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-6 text-[0.9rem] font-medium opacity-80 transition-opacity hover:opacity-100",
          className,
        )}
      >
        <ShareIcon />
        {copied ? "Link kopieret" : label}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      className={cn(
        tone === "light"
          ? "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-[0.85rem] font-semibold text-[#061C3D] transition-transform hover:bg-[#E8F0FB] active:scale-[0.98]"
          : cn(btnClass(tone === "primary" ? "primary" : "outline", "md"), "gap-2"),
        className,
      )}
    >
      <ShareIcon />
      {copied ? "Link kopieret" : label}
    </button>
  );
}
