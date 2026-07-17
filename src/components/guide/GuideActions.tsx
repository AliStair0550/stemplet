"use client";

import { useState } from "react";
import { btnClass } from "@/components/ui";

// "Del med personalet" (den offentlige, login-fri guide) + "Print guide".
export function GuideActions({ publicUrl }: { publicUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Sådan virker det - personale-guide",
          text: "Personale-guide til stempelkortet:",
          url: publicUrl,
        });
      } else {
        await navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // bruger annullerede: ingen fejl
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 print:hidden">
      <button type="button" onClick={share} className={btnClass("terracotta")}>
        {copied ? "Link kopieret" : "Del med personalet"}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className={btnClass("outline")}
      >
        Print guide
      </button>
    </div>
  );
}
