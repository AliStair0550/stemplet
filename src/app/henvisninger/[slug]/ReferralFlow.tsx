"use client";

import { useState } from "react";
import { WalletIcon } from "@/components/ui";
import { referralShareText, referralShareUrl } from "@/lib/referral-text";

// Henvisningssidens klient-del. Henvisningers egen stil (docs/henvisninger.md):
// hvidt rum, systemfont, eet accentfarvet element pr. skaerm (knappen), pille-
// knapper, 12 px hjoerner paa kort. Butikkens farve er accenten.

const INK = "#1D1D1F";
const MUTED = "#6E6E73";
const SURFACE = "#F5F5F7";
const LINE = "#D2D2D7";

type Done = { code: string; referred: boolean; alreadyCustomer: boolean };

export function ReferralFlow(props: {
  slug: string;
  appUrl: string;
  shopName: string;
  logoSrc: string | null;
  accent: string;
  accentFg: string;
  newCustomerReward: string;
  referrerReward: string;
  termsLine: string | null;
  bookingUrl: string | null;
  walletEnabled: boolean;
  referrer: { code: string; firstName: string | null } | null;
  source: "LINK" | "CODE_ENTERED";
  invalidCode: boolean;
  initial: Done | null;
}) {
  const [done, setDone] = useState<Done | null>(props.initial);

  return (
    // Fade + let opadglidning under 300 ms (dokumentet). Genbruger stepIn-
    // keyframen, men ikke .animate-step (350 ms), saa Stemplet er uroert.
    <div
      className="flex w-full max-w-[400px] flex-1 flex-col"
      style={{ animation: "stepIn 0.25s ease-out both" }}
    >
      <header className="flex flex-col items-center gap-3 pb-8">
        {props.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.logoSrc}
            alt={props.shopName}
            className="h-12 w-auto max-w-[60%] object-contain"
          />
        ) : (
          <span className="text-[17px] font-semibold tracking-[-0.01em]">{props.shopName}</span>
        )}
      </header>
      {done ? <DoneView {...props} done={done} /> : <SignupView {...props} onDone={setDone} />}
    </div>
  );
}

// ── Tilmelding (uden og med kode) ────────────────────────────────────

function SignupView(
  props: Parameters<typeof ReferralFlow>[0] & { onDone: (d: Done) => void },
) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const withCode = props.referrer !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/henvisninger/${encodeURIComponent(props.slug)}/tilmeld`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          code: props.referrer?.code ?? null,
          source: props.source,
        }),
      });
      const data = await res.json().catch(() => null);
      if (data?.ok) {
        props.onDone({
          code: data.code,
          referred: data.referred,
          alreadyCustomer: data.alreadyCustomer,
        });
        return;
      }
      setError(data?.message ?? "Der opstod en kortvarig fejl. Prøv igen.");
    } catch {
      setError("Der opstod en kortvarig fejl. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  const heading = withCode
    ? `${props.referrer!.firstName ?? "Din ven"} har givet dig ${props.newCustomerReward} hos ${props.shopName}`
    : `Henvis en ven og få ${props.referrerReward}`;
  const sub = withCode
    ? "Skriv dit navn og nummer, så ligger rabatten klar til dit første besøg."
    : `Din ven får ${props.newCustomerReward} ved første besøg. Du får ${props.referrerReward}, når vennen har været der.`;

  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
        {heading}
      </h1>
      <p className="mt-3 text-center text-[17px] leading-snug" style={{ color: MUTED }}>
        {sub}
      </p>
      {props.invalidCode ? (
        <p className="mt-4 text-center text-[14px]" style={{ color: MUTED }}>
          Koden virker ikke længere. Du kan stadig få din egen kode og henvise dine venner.
        </p>
      ) : null}

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <Field
          label="Navn"
          value={name}
          onChange={setName}
          autoComplete="given-name"
          placeholder="Fornavn"
        />
        <Field
          label="Mobilnummer"
          value={phone}
          onChange={setPhone}
          autoComplete="tel"
          inputMode="tel"
          placeholder="12 34 56 78"
        />
        {error ? (
          <p role="alert" className="text-[14px] text-rust">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 min-h-[52px] rounded-[980px] px-6 text-[17px] font-semibold transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: props.accent, color: props.accentFg }}
        >
          {busy ? "Et øjeblik" : withCode ? "Hent min rabat" : "Få min kode"}
        </button>
      </form>

      {props.termsLine ? (
        <p className="mt-4 text-center text-[14px]" style={{ color: MUTED }}>
          {props.termsLine}
        </p>
      ) : null}
      <p className="mt-3 text-center text-[12px] leading-relaxed" style={{ color: MUTED }}>
        {props.shopName} gemmer dit navn og nummer, så din henvisning kan registreres. Se{" "}
        <a href="/privatliv" target="_blank" rel="noreferrer" className="underline">
          privatlivspolitikken
        </a>
        .
      </p>

      {withCode ? null : <CodeEntry slug={props.slug} />}
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  placeholder: string;
  inputMode?: "tel";
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px]" style={{ color: MUTED }}>
        {props.label}
      </span>
      {/* 17 px: over 16 px, saa iOS ikke zoomer ind ved fokus. */}
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete}
        inputMode={props.inputMode}
        placeholder={props.placeholder}
        required
        className="min-h-[50px] rounded-[12px] px-4 text-[17px] outline-none focus:ring-2"
        style={{ backgroundColor: SURFACE, color: INK }}
      />
    </label>
  );
}

// Lille kodefelt nederst, til dem der fik koden mundtligt. Leder til ?k, saa
// samme side viser vennens gave.
function CodeEntry({ slug }: { slug: string }) {
  const [code, setCode] = useState("");
  return (
    <form
      className="mt-auto flex items-center gap-2 border-t pt-5"
      style={{ borderColor: LINE }}
      onSubmit={(e) => {
        e.preventDefault();
        const c = code.trim();
        if (!c) return;
        window.location.href = `/henvisninger/${encodeURIComponent(slug)}?k=${encodeURIComponent(c)}&via=kode`;
      }}
    >
      <input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Har du en kode fra en ven?"
        autoCapitalize="characters"
        aria-label="Kode fra en ven"
        className="min-h-[44px] flex-1 rounded-[12px] px-3 text-[16px] uppercase outline-none placeholder:normal-case"
        style={{ backgroundColor: SURFACE, color: INK }}
      />
      <button
        type="submit"
        className="min-h-[44px] rounded-[980px] border px-4 text-[15px] font-medium"
        style={{ borderColor: LINE, color: INK }}
      >
        Brug kode
      </button>
    </form>
  );
}

// ── Efter tilmelding ─────────────────────────────────────────────────

function DoneView(props: Parameters<typeof ReferralFlow>[0] & { done: Done }) {
  const { done } = props;
  const shareUrl = referralShareUrl(props.appUrl, props.slug, done.code);
  const walletHref = `/api/wallet/claim/${encodeURIComponent(props.slug)}`;

  if (done.referred) {
    // Ny kunde via en ven: velkomstkortet foerst, egen kode nederst.
    return (
      <div className="flex flex-1 flex-col">
        <h1 className="text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
          Velkommen hos {props.shopName}
        </h1>
        <div className="mt-6 rounded-[12px] px-5 py-6 text-center" style={{ backgroundColor: SURFACE }}>
          <p className="text-[32px] font-semibold tracking-[-0.02em]">{props.newCustomerReward}</p>
          <p className="mt-1 text-[17px]" style={{ color: MUTED }}>
            til dig ved dit første besøg
          </p>
          {props.termsLine ? (
            <p className="mt-3 text-[14px]" style={{ color: MUTED }}>
              {props.termsLine}
            </p>
          ) : null}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {props.bookingUrl ? (
            <a
              href={props.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[52px] items-center justify-center rounded-[980px] px-6 text-[17px] font-semibold"
              style={{ backgroundColor: props.accent, color: props.accentFg }}
            >
              Book tid
            </a>
          ) : null}
          {props.walletEnabled ? <WalletLink href={walletHref} /> : null}
        </div>
        <div className="mt-auto border-t pt-5 text-center" style={{ borderColor: LINE }}>
          <p className="text-[14px]" style={{ color: MUTED }}>
            Du kan også selv henvise. Din kode:
          </p>
          <p className="mt-1 text-[22px] font-semibold tracking-[0.04em]">{done.code}</p>
          <div className="mt-3">
            <ShareButton
              url={shareUrl}
              text={referralShareText(props.shopName, props.newCustomerReward)}
              title={props.shopName}
              variant="outline"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      {done.alreadyCustomer ? (
        <p className="mb-5 rounded-[12px] px-4 py-3 text-center text-[14px]" style={{ backgroundColor: SURFACE, color: MUTED }}>
          Du er allerede kunde hos {props.shopName}, så rabatten gælder nye kunder. Her er din egen kode.
        </p>
      ) : null}
      <p className="text-center text-[14px]" style={{ color: MUTED }}>
        Din kode
      </p>
      <p className="mt-1 text-center text-[44px] font-semibold leading-none tracking-[0.04em]">
        {done.code}
      </p>
      <p className="mx-auto mt-4 max-w-[320px] text-center text-[17px] leading-snug" style={{ color: MUTED }}>
        Din ven får {props.newCustomerReward} ved første besøg. Du får {props.referrerReward}, når vennen har været der.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <ShareButton
          url={shareUrl}
          text={referralShareText(props.shopName, props.newCustomerReward)}
          title={props.shopName}
          accent={props.accent}
          accentFg={props.accentFg}
        />
        {props.walletEnabled ? <WalletLink href={walletHref} /> : null}
      </div>
      {props.termsLine ? (
        <p className="mt-5 text-center text-[14px]" style={{ color: MUTED }}>
          {props.termsLine}
        </p>
      ) : null}
    </div>
  );
}

function WalletLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="flex min-h-[52px] items-center justify-center gap-2 rounded-[980px] border px-6 text-[17px] font-medium"
      style={{ borderColor: LINE, color: INK }}
    >
      <WalletIcon />
      Tilføj til Wallet
    </a>
  );
}

// Web Share API aabner SMS/Messenger direkte. Uden den (fx desktop): kopiér.
function ShareButton(props: {
  url: string;
  text: string;
  title: string;
  accent?: string;
  accentFg?: string;
  variant?: "outline";
}) {
  const [copied, setCopied] = useState(false);
  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: props.title, text: props.text, url: props.url });
        return;
      } catch (e) {
        // Brugeren lukkede arket: ingen fallback.
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(`${props.text} ${props.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Kopiering afvist: linket staar stadig i adresselinjen efter deling.
    }
  }
  const outline = props.variant === "outline";
  return (
    <button
      type="button"
      onClick={share}
      className={`flex w-full items-center justify-center rounded-[980px] px-6 font-semibold transition-opacity active:opacity-80 ${
        outline ? "min-h-[44px] border text-[15px]" : "min-h-[52px] text-[17px]"
      }`}
      style={
        outline
          ? { borderColor: LINE, color: INK }
          : { backgroundColor: props.accent, color: props.accentFg }
      }
    >
      {copied ? "Link kopieret" : "Del med en ven"}
    </button>
  );
}
