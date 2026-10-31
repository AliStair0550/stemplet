"use client";

import { useEffect, useState } from "react";
import { WalletCardPreview, type WalletCardPreviewProps } from "@/components/WalletCardPreview";
import { GIFT_EVENT } from "./ClaimHeading";

// Kortet paa kundesiden. Kommer kunden via en vens gyldige link, viser kortet
// vennens rabat som "Til gode", ligesom det rigtige kort i Wallet goer.
export function ClaimCardPreview({ gift, ...props }: WalletCardPreviewProps & { gift: string | null }) {
  const [hasGift, setHasGift] = useState(false);
  useEffect(() => {
    if (!gift) return;
    const on = () => setHasGift(true);
    window.addEventListener(GIFT_EVENT, on);
    return () => window.removeEventListener(GIFT_EVENT, on);
  }, [gift]);
  if (!gift || !hasGift) return <WalletCardPreview {...props} />;
  return <WalletCardPreview {...props} product={props.product === "henvisninger" ? "henvisninger" : "begge"} owed={gift} />;
}
