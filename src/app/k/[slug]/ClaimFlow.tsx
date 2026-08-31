"use client";

import { useEffect, useRef, useState } from "react";
import { WalletIcon } from "@/components/ui";
import { Spinner } from "@/components/SubmitButton";
import { WalletAddedNotice } from "@/components/WalletAddedNotice";
import { rgba } from "@/lib/brand";

// Fejl-koder (fra claim-ruten via ?fejl=) oversat til en klar besked.
const ERRORS: Record<string, string> = {
  lukket: "Stempelkortet er ikke aktivt lige nu. Spørg personalet i butikken.",
  fuld: "Butikken kan ikke tage imod flere stempelkort lige nu. Spørg personalet.",
  pause: "Butikken tager ikke imod nye stempelkort lige nu. Spørg personalet.",
  stoppet: "Stempelkortet er sat på pause lige nu. Spørg personalet i butikken.",
  // Forbigaaende serverfejl (fx en kortvarig database-blip): kunden kan bare
  // proeve igen om et oejeblik, saa vi viser en "Proev igen"-knap.
  serverfejl: "Der opstod en kortvarig fejl. Prøv igen om et øjeblik.",
  // For mange henvendelser fra samme netvaerk lige nu (fx travl cafe-WiFi).
  optaget: "Der er lidt travlt lige nu. Prøv igen om et øjeblik.",
};

// Fejl-koder hvor et nyt forsoeg giver mening (vis en "Prøv igen"-knap).
const RETRYABLE = new Set(["serverfejl", "optaget"]);

// Den brandede CTA: creme knap (kortets tekstfarve) med kortfarvet tekst, saa
// den altid harmonerer med brandet. Valgfri blOd gloed bagved paa hoved-CTA'en.
function CtaLink({
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

// "Hent mit stempelkort" er et RIGTIGT link til /api/wallet/claim/[slug]. Ruten
// opretter kortet og returnerer .pkpass'et i samme svar, saa Safari aabner Apple
// Wallet-arket direkte fra kundens eget tryk. Ingen skroebelig JavaScript-
// navigation, saa ingen "Prøv igen"-crash.
//
// Raekkefoelge paa iPhone: tryk -> vi viser "Åbner Apple Wallet... tryk Tilføj"
// (saa kunden VED, at der skal trykkes Tilføj i arket). FOERST naar kunden vender
// TILBAGE fra arket (visibility bliver "visible" igen) - eller efter en faldback-
// forsinkelse - viser vi kvitteringen "Dit stempelkort er nu i din Wallet". Foer
// kom kvitteringen med det samme, endda foer arket, saa man kunne tro, at man
// ikke skulle goere noget. Android/desktop sendes af ruten videre til webkortet.
export function ClaimFlow({
  slug,
  walletEnabled,
  // CTA-farver: passer til kortet. Standard = kortets tekstfarve som baggrund og
  // kortfarven som tekst, saa knappen altid harmonerer med brandet.
  ctaBg = "#F6EEE4",
  ctaFg = "#2A1A10",
}: {
  slug: string;
  walletEnabled: boolean;
  ctaBg?: string;
  ctaFg?: string;
}) {
  const [phase, setPhase] = useState<
    "idle" | "opening" | "added" | "usikker"
  >("idle");
  const [fejl, setFejl] = useState<string | null>(null);
  // In-app-browser (fx Messenger/Facebook/Instagram) paa iPhone: deres indbyggede
  // browser (WKWebView) kan IKKE overdrage et .pkpass til Apple Wallet, saa
  // "Hent mit stempelkort" aabner ingenting. Vi opdager det og guider til Safari.
  const [inApp, setInApp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // Blev siden skjult, mens vi ventede? Saa AABNEDE Wallet-arket sig, og
  // kvitteringen er aegte. Skete det aldrig, ved vi ikke, om det lykkedes.
  const wasHiddenRef = useRef(false);
  // Bloker et hurtigt dobbelt-tryk (fx desktop-dobbeltklik), saa der ikke
  // oprettes to kort paa samme enhed.
  const clickedRef = useRef(false);
  const claimUrl = `/api/wallet/claim/${slug}`;

  // Læs en evt. ?fejl=... paa klienten, saa /k-siden kan forblive statisk (ISR).
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("fejl");
    if (code && ERRORS[code]) setFejl(code);
  }, []);

  // Opdag kendte in-app-browsere paa iPhone (kun iOS, for det er dér Wallet-
  // overdragelsen fejler). Holder os til de KENDTE apps for ikke at overvarsle
  // rigtige browsere.
  useEffect(() => {
    const ua = navigator.userAgent || "";
    if (!/iPhone|iPad|iPod/i.test(ua)) return;
    const apps: [RegExp, string][] = [
      [/FBAN|FBAV|FB_IAB|FBIOS|Messenger/i, "Messenger"],
      [/Instagram/i, "Instagram"],
      [/Line\//i, "LINE"],
      [/Snapchat/i, "Snapchat"],
      [/TikTok|musical_ly|BytedanceWebview/i, "TikTok"],
      [/Twitter/i, "X"],
      [/LinkedInApp/i, "LinkedIn"],
      [/Pinterest/i, "Pinterest"],
    ];
    for (const [re, name] of apps) {
      if (re.test(ua)) {
        setInApp(name);
        return;
      }
    }
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Kunne ikke kopiere (fx afvist clipboard): brugeren kan stadig laese/laenge-
      // trykke paa linket i menuen.
    }
  }

  // Vejledning naar man er i en in-app-browser der ikke kan aabne Apple Wallet.
  const inAppNotice =
    inApp && walletEnabled ? (
      <div
        className="w-full rounded-2xl px-5 py-4 text-center text-[0.86rem] font-[300] leading-relaxed"
        style={{
          color: ctaBg,
          background: rgba(ctaBg, 0.12),
          border: `1px solid ${rgba(ctaBg, 0.28)}`,
        }}
      >
        <p className="font-[600]">Åbn i Safari for at hente kortet</p>
        <p className="mt-1.5" style={{ color: rgba(ctaBg, 0.82) }}>
          {inApp} kan ikke lægge kort i Apple Wallet. Tryk på menuen (de tre
          prikker) og vælg &quot;Åbn i Safari&quot;, og hent så kortet.
        </p>
        <button
          type="button"
          onClick={copyLink}
          className="mt-3 inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[0.8rem] font-[500]"
          style={{ backgroundColor: ctaBg, color: ctaFg }}
        >
          {copied ? "Link kopieret" : "Kopiér link"}
        </button>
      </div>
    ) : null;

  // Naar Wallet-arket er aabnet ("opening"): viser vi kvitteringen, naar kunden
  // vender TILBAGE fra arket (siden blev skjult og saa synlig igen). Aabnede
  // arket sig aldrig (typisk et cold start, der stadig arbejder), viser vi ikke
  // en falsk kvittering, men en "prøv igen" efter en romelig faldback.
  useEffect(() => {
    if (phase !== "opening") return;
    wasHiddenRef.current = false;
    const onVisible = () => {
      if (document.visibilityState === "hidden") {
        wasHiddenRef.current = true;
      } else if (document.visibilityState === "visible" && wasHiddenRef.current) {
        setPhase("added");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    const timer = setTimeout(() => {
      setPhase(wasHiddenRef.current ? "added" : "usikker");
    }, 9000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(timer);
    };
  }, [phase]);

  if (fejl) {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <p
          role="status"
          className="w-full rounded-lg border border-rust/40 bg-rust/10 px-5 py-4 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
        >
          {ERRORS[fejl]}
        </p>
        {RETRYABLE.has(fejl) ? (
          <CtaLink href={claimUrl} onTap={onTap} ctaBg={ctaBg} ctaFg={ctaFg}>
            Prøv igen
          </CtaLink>
        ) : null}
      </div>
    );
  }

  if (phase === "added") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <WalletAddedNotice />
        <a
          href={claimUrl}
          className="text-[0.8rem] font-[400] underline underline-offset-2 opacity-80 transition-opacity hover:opacity-100"
          style={{ color: ctaBg }}
        >
          Åbn kortet i Apple Wallet igen
        </a>
      </div>
    );
  }

  if (phase === "usikker") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <p
          role="status"
          className="w-full rounded-lg px-5 py-4 text-center text-[0.85rem] font-[300] leading-relaxed"
          style={{
            color: rgba(ctaBg, 0.85),
            background: rgba(ctaBg, 0.08),
            border: `1px solid ${rgba(ctaBg, 0.18)}`,
          }}
        >
          Åbnede Apple Wallet sig ikke? Første gang kan det tage et øjeblik. Prøv
          igen.
        </p>
        <CtaLink href={claimUrl} onTap={onTap} ctaBg={ctaBg} ctaFg={ctaFg}>
          Prøv igen
        </CtaLink>
      </div>
    );
  }

  if (phase === "opening") {
    return (
      <div
        className="flex w-full flex-col items-center gap-2 rounded-xl p-5 text-center"
        style={{
          background: rgba(ctaBg, 0.1),
          border: `1px solid ${rgba(ctaBg, 0.18)}`,
        }}
      >
        <span className="inline-flex items-center gap-2 text-[0.95rem] font-[500]">
          <Spinner />
          Åbner Apple Wallet
        </span>
        <span
          className="text-[0.84rem] font-[300] leading-relaxed"
          style={{ color: rgba(ctaBg, 0.8) }}
        >
          Tryk <span className="font-[600]">Tilføj</span> i Apple Wallet for at
          gemme dit stempelkort.
        </span>
      </div>
    );
  }

  function onTap(e: React.MouseEvent) {
    // Bloker et hurtigt dobbelt-tryk, saa der ikke fyres to claim-requests (og
    // dermed to kort) af paa samme enhed. Slippes igen efter kort tid, saa et
    // aegte nyt forsoeg stadig virker.
    if (clickedRef.current) {
      e.preventDefault();
      return;
    }
    clickedRef.current = true;
    setTimeout(() => {
      clickedRef.current = false;
    }, 1500);
    // iPhone: passet aabnes i Wallet-arket, og siden bliver liggende. Vi gaar i
    // "opening" og venter med kvitteringen til kunden kommer tilbage. Android/
    // desktop sendes videre af ruten (ingen kvittering her).
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (ios && walletEnabled) setPhase("opening");
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {inAppNotice}
      <CtaLink href={claimUrl} onTap={onTap} ctaBg={ctaBg} ctaFg={ctaFg} withGlow>
        <WalletIcon />
        Hent mit stempelkort
      </CtaLink>
    </div>
  );
}
