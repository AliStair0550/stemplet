"use client";

import { ShareLinkButton } from "@/components/ShareLinkButton";
import { markCardShared } from "./actions";

// "Del kortet" i dashboardet: deler kundesiden med en faerdig besked og husker,
// at kortet er delt (Kom i gang krydser trinnet af).
export function ShareCardButton({
  businessName,
  url,
  text,
  shared,
  tone = "primary",
  className,
}: {
  businessName: string;
  url: string;
  text: string;
  shared: boolean;
  tone?: "primary" | "light" | "default";
  className?: string;
}) {
  return (
    <ShareLinkButton
      businessName={businessName}
      url={url}
      text={text}
      tone={tone}
      className={className}
      onShared={shared ? undefined : () => void markCardShared().catch(() => {})}
    />
  );
}
