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

// Kontaktformularen (trin 1 for nye kunder): navn og e-mail er paakraevet, og
// nyheder paa mail er et frivilligt, ikke-afkrydset flueben. Indsendes med
// fetch til ./kontakt, som opretter kortet og saetter cookies. Wallet aabnes
// FOERST bagefter fra det rigtige link (trin 2), saa aabningen forbliver
// paalidelig.
function ContactForm({
  slug,
  shopName,
  ctaBg,
  ctaFg,
  onReady,
  onFejl,
}: {
  slug: string;
  shopName: string;
  ctaBg: string;
  ctaFg: string;
  onReady: () => void;
  onFejl: (code: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/claim/${encodeURIComponent(slug)}/kontakt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, consent }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; code?: string; message?: string }
        | null;
      if (data?.ok) {
        onReady();
        return;
      }
      if (data?.message) setError(data.message);
      else onFejl(data?.code && ERRORS[data.code] ? data.code : "serverfejl");
    } catch {
      onFejl("serverfejl");
    } finally {
      setBusy(false);
    }
  }

  const inputStyle = {
    color: ctaBg,
    background: rgba(ctaBg, 0.08),
    border: `1px solid ${rgba(ctaBg, 0.28)}`,
  };
  const inputCls =
    "w-full rounded-xl px-4 py-3 text-[1rem] font-[400] outline-none placeholder:opacity-50 focus:ring-2";

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-3" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.78rem] font-[500]" style={{ color: rgba(ctaBg, 0.85) }}>
          Navn
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          maxLength={40}
          required
          placeholder="Dit navn"
          className={inputCls}
          style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[0.78rem] font-[500]" style={{ color: rgba(ctaBg, 0.85) }}>
          E-mail
        </span>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={254}
          required
          placeholder="navn@mail.dk"
          className={inputCls}
          style={inputStyle}
        />
      </label>
      <label className="flex cursor-pointer items-start gap-3 py-1 text-left">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
          style={{ accentColor: ctaBg }}
        />
        <span className="text-[0.84rem] font-[300] leading-snug" style={{ color: rgba(ctaBg, 0.85) }}>
          Ja tak til nyheder og tilbud fra {shopName} på mail. Du kan altid
          framelde dig igen.
        </span>
      </label>
      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-rust/40 bg-rust/10 px-4 py-3 text-center text-[0.85rem] font-[300] leading-relaxed text-rust"
        >
          {error}
        </p>
      ) : null}
      <div className="relative mt-1 w-full">
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-2xl blur-md animate-cta-glow"
          style={{ background: rgba(ctaBg, 0.3) }}
        />
        <button
          type="submit"
          disabled={busy}
          className="relative flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl px-8 py-3.5 text-[0.95rem] font-medium tracking-[-0.01em] shadow-lift transition-transform duration-200 active:scale-[0.98] disabled:opacity-70"
          style={{ backgroundColor: ctaBg, color: ctaFg }}
        >
          {busy ? <Spinner /> : null}
          {busy ? "Et øjeblik" : "Fortsæt"}
        </button>
      </div>
    </form>
  );
}

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
  shopName,
  // CTA-farver: passer til kortet. Standard = kortets tekstfarve som baggrund og
  // kortfarven som tekst, saa knappen altid harmonerer med brandet.
  ctaBg = "#F6EEE4",
  ctaFg = "#2A1A10",
}: {
  slug: string;
  walletEnabled: boolean;
  shopName: string;
  ctaBg?: string;
  ctaFg?: string;
}) {
  const [phase, setPhase] = useState<
    "idle" | "opening" | "added" | "usikker"
  >("idle");
  const [fejl, setFejl] = useState<string | null>(null);
  // Nye kunder udfylder foerst formularen ("form"); har enheden allerede et
  // kort (eller er formularen sendt), er vi "ready" og viser Wallet-linket.
  // "checking" er det korte opslag ved indlaesning, saa en returkunde ikke ser
  // formularen blinke.
  const [stage, setStage] = useState<"checking" | "form" | "ready">("checking");
  const [justCreated, setJustCreated] = useState(false);
  const [ios, setIos] = useState(false);
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

  // Har enheden allerede et kort hos butikken? Saa eet tryk som foer.
  useEffect(() => {
    setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent || ""));
    let alive = true;
    const ctrl = new AbortController();
    const fallback = setTimeout(() => ctrl.abort(), 6000);
    fetch(`/api/wallet/claim/${encodeURIComponent(slug)}/kontakt`, {
      cache: "no-store",
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((d: { known?: boolean }) => {
        if (alive) setStage(d?.known ? "ready" : "form");
      })
      .catch(() => {
        if (alive) setStage("form");
      })
      .finally(() => clearTimeout(fallback));
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, [slug]);

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

  // Brugervenlig vejledning naar man er i en in-app-browser (fx Messenger/
  // Instagram), der ikke kan lægge kort i Apple Wallet. Et klart 2-trins-forloeb
  // med "Kopiér link" som den primaere handling.
  const stepBadge = (n: string) => (
    <span
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.78rem] font-[600]"
      style={{ backgroundColor: ctaBg, color: ctaFg }}
    >
      {n}
    </span>
  );
  const inAppNotice =
    inApp && walletEnabled ? (
      <div
        className="w-full rounded-2xl p-5"
        style={{
          color: ctaBg,
          background: rgba(ctaBg, 0.12),
          border: `1px solid ${rgba(ctaBg, 0.28)}`,
        }}
      >
        <p className="text-center text-[0.98rem] font-[600]">
          Gem kortet i Apple Wallet
        </p>
        <p
          className="mx-auto mt-1.5 max-w-[19rem] text-center text-[0.84rem] font-[300] leading-relaxed"
          style={{ color: rgba(ctaBg, 0.82) }}
        >
          {inApp} kan ikke gemme kort i Apple Wallet. Det tager to hurtige trin i
          Safari:
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {stepBadge("1")}
            <button
              type="button"
              onClick={copyLink}
              className="flex min-h-[2.9rem] flex-1 items-center justify-center gap-2 rounded-xl px-4 text-[0.9rem] font-[600] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: ctaBg, color: ctaFg }}
            >
              {copied ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Link kopieret
                </>
              ) : (
                "Kopiér link"
              )}
            </button>
          </div>
          <div className="flex items-center gap-3">
            {stepBadge("2")}
            <p
              className="flex-1 text-[0.86rem] font-[300] leading-relaxed"
              style={{ color: rgba(ctaBg, 0.9) }}
            >
              Åbn <span className="font-[600]">Safari</span>, indsæt linket og
              hent dit stempelkort.
            </p>
          </div>
        </div>

        <p
          className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5 border-t pt-3 text-center text-[0.78rem] font-[300] leading-relaxed"
          style={{ borderColor: rgba(ctaBg, 0.2), color: rgba(ctaBg, 0.72) }}
        >
          <span>Eller tryk på</span>
          <span
            aria-hidden
            className="inline-flex items-center justify-center rounded-full px-1.5 py-0.5"
            style={{ background: rgba(ctaBg, 0.14) }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
              <circle cx="5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="19" cy="12" r="1.7" />
            </svg>
          </span>
          <span>øverst i {inApp}, og vælg &quot;Åbn i ekstern browser&quot;.</span>
        </p>
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

  // In-app-browser vinder over alle faser: er vi i Messenger/Instagram m.fl.,
  // kan Wallet aldrig aabne, saa vis KUN Safari-vejledningen. Ellers kunne et
  // tryk (fOr detektionen naaede at koere) laase kunden i "opening"/"usikker".
  if (inAppNotice) return inAppNotice;

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
    if (ios && walletEnabled && !inApp) setPhase("opening");
  }

  if (stage === "checking") {
    return (
      <div className="flex min-h-[3.25rem] w-full items-center justify-center" style={{ color: rgba(ctaBg, 0.8) }}>
        <Spinner />
      </div>
    );
  }

  if (stage === "form") {
    return (
      <ContactForm
        slug={slug}
        shopName={shopName}
        ctaBg={ctaBg}
        ctaFg={ctaFg}
        onReady={() => {
          setJustCreated(true);
          setStage("ready");
        }}
        onFejl={setFejl}
      />
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {justCreated ? (
        <p className="text-center text-[0.9rem] font-[400]" style={{ color: rgba(ctaBg, 0.9) }}>
          {ios && walletEnabled
            ? "Dit kort er klar. Læg det i Apple Wallet."
            : "Dit kort er klar."}
        </p>
      ) : null}
      <CtaLink href={claimUrl} onTap={onTap} ctaBg={ctaBg} ctaFg={ctaFg} withGlow>
        <WalletIcon />
        {justCreated
          ? ios && walletEnabled
            ? "Tilføj til Apple Wallet"
            : "Åbn mit stempelkort"
          : "Hent mit stempelkort"}
      </CtaLink>
    </div>
  );
}
