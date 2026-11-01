"use client";

import { useEffect, useRef, useState } from "react";
import { rgba } from "@/lib/brand";
import { referralShareText } from "@/lib/referral-text";
import type { ShopStatus } from "@/app/api/k/[slug]/status/route";

// Det, kunden ser, naar kortet er hentet: henvis en ven, del butikken og
// knapper som Book tid.

// "Henvis en ven" for en kunde med kort: egen kode, del-knap (telefonens
// delemenu), kopiér link og det, kunden har til gode.
export function ReferralPanel({
  me,
  shopName,
  newCustomerReward,
  referrerReward,
  ctaBg,
  ctaFg,
  focus,
}: {
  me: NonNullable<ShopStatus["me"]>;
  shopName: string;
  newCustomerReward: string;
  referrerReward: string;
  ctaBg: string;
  ctaFg: string;
  focus: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (focus) ref.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focus]);
  const text = referralShareText(shopName, newCustomerReward);

  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shopName, text, url: me.shareUrl });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    await copy();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${me.shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* kopiering afvist: koden staar stadig paa skaermen */
    }
  }

  const muted = { color: rgba(ctaBg, 0.78) };
  return (
    <section
      ref={ref}
      aria-label="Henvis en ven"
      className="flex w-full flex-col gap-3 rounded-2xl p-5 text-center"
      style={{ background: rgba(ctaBg, 0.1), border: `1px solid ${rgba(ctaBg, 0.2)}` }}
    >
      <h2 className="text-[1.15rem] font-[600]">Henvis en ven</h2>
      <p className="text-[0.9rem] leading-relaxed" style={muted}>
        Send dit link. Din ven får {newCustomerReward} ved første besøg, og du får {referrerReward}, når vennen har været her.
      </p>
      {me.made > 0 ? (
        <p className="text-[0.9rem] font-[600]">
          {me.made} {me.made === 1 ? "ven har" : "venner har"} fået kortet via dig
        </p>
      ) : null}
      <button
        type="button"
        onClick={share}
        className="flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl px-6 text-[0.95rem] font-medium shadow-lift transition-transform active:scale-[0.98]"
        style={{ backgroundColor: ctaBg, color: ctaFg }}
      >
        {copied ? "Link kopieret" : "Del med en ven"}
      </button>
      <button type="button" onClick={copy} className="text-[0.84rem] underline underline-offset-2 opacity-80">
        Kopiér link
      </button>
      {me.rewards.length > 0 ? (
        <p className="border-t pt-3 text-[0.88rem]" style={{ borderColor: rgba(ctaBg, 0.18) }}>
          Du har til gode: <span className="font-[600]">{me.rewards.join(", ")}</span>
          {/* "100 kr." slutter allerede med punktum. */}
          {me.rewards.join(", ").endsWith(".") ? "" : "."} Vis kortet ved kassen.
        </p>
      ) : null}
    </section>
  );
}

// Den brandede CTA: creme knap (kortets tekstfarve) med kortfarvet tekst, saa
// den altid harmonerer med brandet. Valgfri blOd gloed bagved paa hoved-CTA'en.
// Del butikkens kortside (ikke en personlig henvisning: kunden har intet kort
// endnu). Telefonens delemenu, ellers kopieres linket.
export function ShareShopButton({ slug, shopName, ctaBg }: { slug: string; shopName: string; ctaBg: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/k/${slug}`;
    const text = `Hent dit kort hos ${shopName} her:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: shopName, text, url });
        return;
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Kunne ikke kopiere: intet at goere.
    }
  }
  return (
    <button
      type="button"
      onClick={share}
      className="group flex min-h-[3rem] w-full items-center justify-center gap-2.5 rounded-2xl px-5 text-[0.92rem] font-[500] transition-[transform,background-color] hover:bg-white/5 active:scale-[0.98]"
      style={{ color: ctaBg, border: `1.5px solid ${rgba(ctaBg, 0.35)}` }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" className="h-[1.05rem] w-[1.05rem] transition-transform group-active:-translate-y-0.5" aria-hidden>
        <path d="M12 3v12" />
        <path d="m7 8 5-5 5 5" />
        <path d="M5 13v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      </svg>
      {copied ? "Link kopieret" : "Del kortet med en ven"}
    </button>
  );
}

export function CtaLink({
  href,
  onTap,
  ctaBg,
  ctaFg,
  withGlow = false,
  children,
}: {
  href: string;
  onTap: (e: React.MouseEvent) => void;
  ctaBg: string;
  ctaFg: string;
  withGlow?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative w-full">
      {withGlow ? (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl blur-md animate-cta-glow"
          style={{ background: rgba(ctaBg, 0.3) }}
        />
      ) : null}
      <a
        href={href}
        onClick={onTap}
        className="relative flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium tracking-[-0.01em] shadow-lift transition-transform duration-200 active:scale-[0.98]"
        style={{ backgroundColor: ctaBg, color: ctaFg }}
      >
        {children}
      </a>
    </div>
  );
}
