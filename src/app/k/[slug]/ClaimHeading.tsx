"use client";

import { useEffect, useState } from "react";
import { rgba } from "@/lib/brand";
import type { ShopStatus } from "@/app/api/k/[slug]/status/route";

// Overskriften over kortet. Kommer kunden via en vens link (?k=), siger den
// straks, at der ligger en gave ("Emma har givet dig 100 kr."), saa man ved,
// hvad det handler om, foer man ser kortet. Vennens fornavn hentes bagefter.
export function ClaimHeading({
  slug,
  shop,
  gift,
  color,
}: {
  slug: string;
  shop: string;
  gift: string | null;
  color: string;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [friend, setFriend] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const k = new URLSearchParams(window.location.search).get("k");
    if (!k || !gift) return;
    setCode(k);
    fetch(`/api/k/${encodeURIComponent(slug)}/status?k=${encodeURIComponent(k)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<ShopStatus>)
      .then((s) => {
        if (s.invalidCode || s.known) setInvalid(true);
        else setFriend(s.friend?.firstName ?? null);
      })
      .catch(() => {});
  }, [slug, gift]);

  if (code && gift && !invalid) {
    return (
      <div className="flex flex-col gap-2" style={{ animation: "fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both" }}>
        <h1 className="text-[1.75rem] font-[500] leading-[1.1] tracking-[-0.02em]" style={{ color }}>
          {friend ?? "Din ven"} har givet dig {gift}
        </h1>
        <p className="mx-auto max-w-xs text-[0.98rem] leading-snug" style={{ color: rgba(color, 0.78) }}>
          Hent dit kort hos {shop}, så ligger rabatten klar til dit første besøg.
        </p>
      </div>
    );
  }
  return (
    <h1 className="font-[300] text-[1.5rem] leading-tight" style={{ color }}>
      Dit kort hos {shop}
    </h1>
  );
}
