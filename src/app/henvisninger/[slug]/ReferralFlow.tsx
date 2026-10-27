"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletIcon } from "@/components/ui";
import { Confetti, CheckBurst } from "@/components/Celebrate";
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
  /** Kunden aabnede sit eget link eller tastede sin egen kode. */
  ownLink?: boolean;
  /** Den kode kunden brugte, hvis den ikke blev fundet (ellers null). */
  invalidCode: string | null;
  initial: Done | null;
}) {
  const [done, setDone] = useState<Done | null>(props.initial);
  // Lige tilmeldt (ikke en genkendt kunde): fejr det med flueben og konfetti.
  const [fresh, setFresh] = useState(false);

  return (
    // Fade + let opadglidning under 300 ms (dokumentet). Genbruger stepIn-
    // keyframen, men ikke .animate-step (350 ms), saa Stemplet er uroert.
    <div
      className="flex w-full max-w-[400px] flex-1 flex-col"
      style={{ animation: "stepIn 0.25s ease-out both" }}
    >
      <ShopHero
        {...props}
        tagline={
          done
            ? "Tak, fordi du anbefaler os"
            : props.referrer
              ? "En gave fra en ven"
              : "Anbefal os til en ven"
        }
      />
      {done && props.ownLink ? (
        <p
          role="status"
          className="mb-6 rounded-[12px] px-4 py-3 text-center text-[15px]"
          style={{ backgroundColor: SURFACE, color: INK }}
        >
          Det er dit eget link. Send det til en ven, så får vennen {props.newCustomerReward} ved første besøg.
        </p>
      ) : null}
      {fresh ? <Confetti colors={[props.accent, "#1D1D1F", "#C9A24B", "#E2DDD5"]} /> : null}
      {done ? (
        <DoneView {...props} done={done} fresh={fresh} />
      ) : (
        <SignupView
          {...props}
          onDone={(d) => {
            setDone(d);
            setFresh(true);
          }}
        />
      )}
      <Link
        href="/henvisninger"
        className="mt-10 flex items-center justify-center gap-1.5 pb-2 text-[12px]"
        style={{ color: MUTED }}
      >
        Drevet af
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/henvisninger-logo.svg" alt="Henvisninger" className="h-[18px] w-auto opacity-70" />
      </Link>
    </div>
  );
}

// Butikkens kort oeverst: butikkens farve, logo i en hvid flise og navnet. Det er
// det, folk ser, naar butikken linker til siden fra hjemmeside og sociale medier.
function ShopHero(props: Parameters<typeof ReferralFlow>[0] & { tagline: string }) {
  const initials = props.shopName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <header
      className="mb-7 rounded-[22px] px-6 pb-6 pt-7 text-center"
      style={{ backgroundColor: props.accent, color: props.accentFg }}
    >
      <span className="mx-auto flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-[0_6px_18px_-8px_rgba(0,0,0,0.35)]">
        {props.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.logoSrc} alt={props.shopName} className="h-[78%] w-[78%] object-contain" />
        ) : (
          <span className="text-[24px] font-bold tracking-[-0.02em]" style={{ color: props.accent }}>
            {initials}
          </span>
        )}
      </span>
      <p className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em]">{props.shopName}</p>
      <p className="mt-1 text-[14px] opacity-80">{props.tagline}</p>
    </header>
  );
}

function RewardTiles(props: { newCustomerReward: string; referrerReward: string }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {[
        { label: "Din ven får", value: props.newCustomerReward, sub: "ved første besøg" },
        { label: "Du får", value: props.referrerReward, sub: "når vennen har været her" },
      ].map((t) => (
        <div key={t.label} className="rounded-[14px] px-4 py-3.5 text-left" style={{ backgroundColor: SURFACE }}>
          <p className="text-[13px]" style={{ color: MUTED }}>
            {t.label}
          </p>
          <p className="mt-0.5 text-[20px] font-semibold leading-tight tracking-[-0.01em] first-letter:uppercase" style={{ color: INK }}>
            {t.value}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug" style={{ color: MUTED }}>
            {t.sub}
          </p>
        </div>
      ))}
    </div>
  );
}

// Kundens link, stort og tydeligt, med Kopiér. Uden https:// saa det kan laeses.
function LinkBox({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const shown = url.replace(/^https?:\/\//, "");
  return (
    <div className="flex items-center gap-2 rounded-[14px] py-2 pl-4 pr-2" style={{ backgroundColor: SURFACE }}>
      <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: INK }}>
        {shown}
      </span>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            // Kopiering afvist: linket kan stadig markeres og kopieres manuelt.
          }
        }}
        className="min-h-[40px] shrink-0 rounded-[980px] bg-white px-4 text-[14px] font-semibold shadow-sm"
        style={{ color: INK }}
      >
        {copied ? "Kopieret" : "Kopiér"}
      </button>
    </div>
  );
}

// ── Tilmelding (uden og med kode) ────────────────────────────────────

function SignupView(
  props: Parameters<typeof ReferralFlow>[0] & { onDone: (d: Done) => void },
) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // E-mailen har allerede et kort: tilbyd et gendannelseslink paa mail.
  const [taken, setTaken] = useState<"no" | "yes" | "sending" | "sent">("no");
  const withCode = props.referrer !== null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setTaken("no");
    try {
      const res = await fetch(`/api/henvisninger/${encodeURIComponent(props.slug)}/tilmeld`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          consent,
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
      if (data?.code === "mail_findes") setTaken("yes");
      setError(data?.message ?? "Der opstod en kortvarig fejl. Prøv igen.");
    } catch {
      setError("Der opstod en kortvarig fejl. Prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  async function sendRecovery() {
    setTaken("sending");
    try {
      const res = await fetch(`/api/wallet/claim/${encodeURIComponent(props.slug)}/gendan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as { ok: boolean; message?: string } | null;
      if (data?.ok) {
        setTaken("sent");
        setError(null);
      } else {
        setTaken("yes");
        setError(data?.message ?? "Der opstod en kortvarig fejl. Prøv igen.");
      }
    } catch {
      setTaken("yes");
      setError("Der opstod en kortvarig fejl. Prøv igen.");
    }
  }

  const heading = withCode
    ? `${props.referrer!.firstName ?? "Din ven"} har givet dig ${props.newCustomerReward} hos ${props.shopName}`
    : "Henvis en ven";
  const sub = withCode
    ? "Skriv dit navn og din e-mail, så ligger rabatten klar til dit første besøg."
    : `Din ven får ${props.newCustomerReward} ved første besøg. Du får ${props.referrerReward}, når vennen har været der.`;

  return (
    <div className="flex flex-1 flex-col">
      {props.invalidCode ? (
        // Tydelig, ikke til at overse: koden kunden skrev, og hvad hun kan goere.
        <p role="alert" className="mb-6 rounded-[12px] border border-rust/30 bg-rust/5 px-4 py-3 text-center text-[15px] leading-snug text-rust">
          Vi kunne ikke finde koden &quot;{props.invalidCode}&quot;. Tjek at den er skrevet rigtigt, eller bed din ven om linket.
        </p>
      ) : null}
      <h1 className="text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
        {heading}
      </h1>
      {withCode ? (
        <p className="mt-3 text-center text-[17px] leading-snug" style={{ color: MUTED }}>
          {sub}
        </p>
      ) : (
        <div className="mt-5">
          <RewardTiles newCustomerReward={props.newCustomerReward} referrerReward={props.referrerReward} />
        </div>
      )}

      <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
        <Field
          label="Navn"
          value={name}
          onChange={setName}
          autoComplete="given-name"
          placeholder="Fornavn"
        />
        <Field
          label="E-mail"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          inputMode="email"
          type="email"
          placeholder="navn@mail.dk"
        />
        {/* Frivilligt og ikke afkrydset: samtykke til nyhedsmail (markedsfoeringsloven). */}
        <label className="flex cursor-pointer items-start gap-3 py-1">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0"
            style={{ accentColor: props.accent }}
          />
          <span className="text-[14px] leading-snug" style={{ color: MUTED }}>
            Ja tak til nyheder og tilbud fra {props.shopName} på mail. Du kan
            altid framelde dig igen.
          </span>
        </label>
        {taken === "sent" ? (
          <p role="status" className="text-[14px]">
            Tjek din mail. Åbn linket på denne telefon for at gendanne dit kort. Det virker i 30 minutter.
          </p>
        ) : error ? (
          <p role="alert" className="text-[14px] text-rust">
            {error}
          </p>
        ) : null}
        {taken === "yes" || taken === "sending" ? (
          <button
            type="button"
            disabled={taken === "sending"}
            onClick={sendRecovery}
            className="min-h-[44px] rounded-[980px] border px-5 text-[15px] font-semibold disabled:opacity-60"
            style={{ borderColor: props.accent }}
          >
            {taken === "sending" ? "Et øjeblik" : "Send link til min mail"}
          </button>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 min-h-[52px] rounded-[980px] px-6 text-[17px] font-semibold transition-opacity active:opacity-80 disabled:opacity-60"
          style={{ backgroundColor: props.accent, color: props.accentFg }}
        >
          {busy ? "Et øjeblik" : withCode ? "Hent min rabat" : "Få mit link"}
        </button>
      </form>

      {props.termsLine ? (
        <p className="mt-4 text-center text-[14px]" style={{ color: MUTED }}>
          {props.termsLine}
        </p>
      ) : null}
      <p className="mb-6 mt-3 text-center text-[12px] leading-relaxed" style={{ color: MUTED }}>
        {props.shopName} gemmer dit navn og din e-mail, så din henvisning og dit kort
        kan registreres. Nyheder på mail får du kun, hvis du siger ja tak. Se{" "}
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
  inputMode?: "tel" | "email";
  type?: "text" | "email";
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
        type={props.type ?? "text"}
        autoCapitalize={props.type === "email" ? "none" : undefined}
        spellCheck={props.type === "email" ? false : undefined}
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
        placeholder="Har du en henvisningskode?"
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

function DoneView(props: Parameters<typeof ReferralFlow>[0] & { done: Done; fresh: boolean }) {
  const { done, fresh } = props;
  // Koden/rabatten "popper" frem lige efter tilmelding.
  const pop = fresh ? { animation: "celebrate-pop 420ms 120ms cubic-bezier(0.16, 1, 0.3, 1) both" } : undefined;
  const badge = fresh ? (
    <div className="mb-4 flex justify-center">
      <CheckBurst size={56} bg={props.accent} fg={props.accentFg} />
    </div>
  ) : null;
  const shareUrl = referralShareUrl(props.appUrl, props.slug, done.code);
  const walletHref = `/api/wallet/claim/${encodeURIComponent(props.slug)}`;

  if (done.referred) {
    // Ny kunde via en ven: velkomstkortet foerst, egen kode nederst.
    return (
      <div className="flex flex-1 flex-col">
        {badge}
        <h1 className="text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
          Velkommen hos {props.shopName}
        </h1>
        <div className="mt-6 rounded-[12px] px-5 py-6 text-center" style={{ backgroundColor: SURFACE, ...pop }}>
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
          {props.walletEnabled ? (
            <>
              <WalletLink href={walletHref} />
              <WalletHint text="Rabatten og din egen kode står på kortet. Vis det ved kassen, så registrerer de dit besøg." />
            </>
          ) : null}
        </div>
        <div className="mt-auto border-t pt-5 text-center" style={{ borderColor: LINE }}>
          <p className="mb-2 text-[14px]" style={{ color: MUTED }}>
            Du kan også selv henvise. Dit link:
          </p>
          <LinkBox url={shareUrl} />
          <p className="mt-2 text-[13px]" style={{ color: MUTED }}>
            Eller giv din ven koden <span className="font-semibold tracking-[0.04em]" style={{ color: INK }}>{done.code}</span>
          </p>
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
      {badge}
      <h1 className="text-center text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
        {fresh ? "Dit link er klar" : "Dit link"}
      </h1>
      <p className="mx-auto mt-2 max-w-[320px] text-center text-[16px] leading-snug" style={{ color: MUTED }}>
        Send det til en ven. Når vennen har været her, får du {props.referrerReward}
        {props.referrerReward.endsWith(".") ? "" : "."}
      </p>
      <div className="mt-6" style={pop}>
        <LinkBox url={shareUrl} />
      </div>
      <p className="mt-3 text-center text-[14px]" style={{ color: MUTED }}>
        Eller giv din ven koden{" "}
        <span className="font-semibold tracking-[0.04em]" style={{ color: INK }}>
          {done.code}
        </span>
      </p>
      <div className="mt-6">
        <RewardTiles newCustomerReward={props.newCustomerReward} referrerReward={props.referrerReward} />
      </div>
      <div className="mt-6 flex flex-col gap-3">
        <ShareButton
          url={shareUrl}
          text={referralShareText(props.shopName, props.newCustomerReward)}
          title={props.shopName}
          accent={props.accent}
          accentFg={props.accentFg}
        />
        {props.walletEnabled ? (
          <>
            <WalletLink href={walletHref} />
            <WalletHint text="Gem koden på dit kort i Wallet. Så har du den altid med, og du kan se, hvad du har til gode." />
          </>
        ) : null}
      </div>
      {props.termsLine ? (
        <p className="mt-5 text-center text-[14px]" style={{ color: MUTED }}>
          {props.termsLine}
        </p>
      ) : null}
    </div>
  );
}

function WalletHint({ text }: { text: string }) {
  return (
    <p className="-mt-1 text-center text-[13px] leading-snug" style={{ color: MUTED }}>
      {text}
    </p>
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
