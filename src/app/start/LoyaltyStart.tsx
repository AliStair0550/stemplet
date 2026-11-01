"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FolkaLogo, KundekortMark } from "@/components/ProductLogo";
import { StampIcon } from "@/components/StampIcon";
import { WalletCardPreview } from "@/components/WalletCardPreview";
import { Confetti } from "@/components/Celebrate";
import { DEFAULT_PRIMARY, DEFAULT_TEXT, STAMP_ICONS, type StampIconKey } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { createLoyaltyBusinessAction, loginWithOnboardingToken } from "./actions";

// Oprettelse af loyalitetskortet (/start). Butikken vaelger, hvad kortet skal
// kunne fra start: henvisninger og stempler er begge valgt, men hver kan slaas
// fra (og til igen senere under Regler). Kortet vises live, som kunderne ser det
// i Wallet. Butikken oprettes med det samme, og ejeren logges direkte ind paa Hjem.

const FONT = 'var(--font-kk), -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const MIN = 4;
const MAX = 12;
const REWARD_MAX = 28;

const ICONS: { key: StampIconKey; label: string }[] = [
  { key: "coffee", label: "Kaffe" },
  { key: "scissors", label: "Frisør" },
  { key: "croissant", label: "Bager" },
  { key: "pizza", label: "Pizza" },
  { key: "burger", label: "Burger" },
  { key: "icecream", label: "Is" },
  { key: "beer", label: "Øl" },
  { key: "nailpolish", label: "Negle" },
  { key: "sparkle", label: "Skønhed" },
  { key: "flower", label: "Blomster" },
  { key: "paw", label: "Dyr" },
  { key: "star", label: "Andet" },
];

const STAMP_SUGGESTIONS = ["Gratis kaffe", "Gratis klip", "50 kr. rabat", "En på huset"];
const FRIEND_SUGGESTIONS = ["100 kr.", "10 %", "Gratis kaffe"];
const REFERRER_SUGGESTIONS = ["100 kr.", "Gratis klip", "En på huset"];

const inputCls =
  "min-h-[52px] w-full rounded-[14px] bg-[#F2F5F9] px-4 text-[17px] text-[#0B1628] outline-none transition-shadow placeholder:text-[#0B1628]/35 focus:ring-2 focus:ring-[#1B5EAE]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[14px] font-medium text-[#0B1628]/60">{children}</span>;
}

function Chips({ items, onPick }: { items: string[]; onPick: (v: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onPick(s)}
          className="rounded-full border border-[#0B1628]/15 px-3 py-1.5 text-[13px] text-[#0B1628]/70 hover:border-[#0B1628]/50"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

/** Et modul paa kortet, der kan slaas til og fra. */
function ModuleTile({
  on,
  onToggle,
  title,
  text,
  icon,
}: {
  on: boolean;
  onToggle: () => void;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-[18px] border-2 p-4 text-left transition-[border-color,background-color,transform] active:scale-[0.98]",
        on ? "border-[#061C3D] bg-white" : "border-[#0B1628]/10 bg-[#F2F5F9] hover:border-[#0B1628]/25",
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          on ? "bg-[#061C3D] text-white" : "bg-white text-[#0B1628]/50",
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-semibold">{title}</span>
        <span className="block text-[14px] leading-snug text-[#0B1628]/60">{text}</span>
      </span>
      <span
        className={cn(
          "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          on ? "border-[#061C3D] bg-[#061C3D] text-white" : "border-[#0B1628]/20 text-transparent",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      </span>
    </button>
  );
}

// "Du får en på huset" midt i en saetning; tal og "kr." roeres ikke.
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

type Field = "name" | "friend" | "referrer" | "reward" | "email" | "terms";

export function LoyaltyStart({ initial = "begge" }: { initial?: "begge" | "henvisninger" | "stempler" }) {
  const [businessName, setBusinessName] = useState("");
  const [useReferrals, setUseReferrals] = useState(initial !== "stempler");
  const [useStamps, setUseStamps] = useState(initial !== "henvisninger");
  const [friend, setFriend] = useState("");
  const [referrer, setReferrer] = useState("");
  const [reward, setReward] = useState("");
  const [stamps, setStamps] = useState(10);
  const [icon, setIcon] = useState<StampIconKey>("coffee");
  const [allIcons, setAllIcons] = useState(false);
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fejlen vises ved det felt, den handler om, og siden ruller dertil.
  const [errorField, setErrorField] = useState<Field | null>(null);
  // Feltet findes via data-field, naar en fejl skal vises ved det.
  const fieldRef = (f: Field) => ({ "data-field": f });
  const [loginToken, setLoginToken] = useState<string | null>(null);
  // Mailen havde allerede et login (fx som medarbejder): butikken er oprettet,
  // og der er sendt et login-link i stedet for at logge direkte ind.
  const [linkSentTo, setLinkSentTo] = useState<string | null>(null);
  const loginForm = useRef<HTMLFormElement>(null);

  // Oprettet: log direkte ind paa Hjem.
  useEffect(() => {
    if (loginToken) loginForm.current?.requestSubmit();
  }, [loginToken]);

  function fail(field: Field | null, msg: string) {
    setError(msg);
    setErrorField(field);
    const el = field ? document.querySelector<HTMLInputElement>(`[data-field="${field}"]`) : null;
    if (el) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.focus({ preventScroll: true });
    }
  }
  const fieldError = (f: Field) =>
    errorField === f && error ? (
      <p role="alert" className="mt-2 text-[14px] text-rust">
        {error}
      </p>
    ) : null;
  const clearError = (f: Field) => {
    if (errorField === f) {
      setError(null);
      setErrorField(null);
    }
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setErrorField(null);
    if (!businessName.trim()) return fail("name", "Skriv navnet på din butik.");
    if (!useReferrals && !useStamps) return fail(null, "Vælg mindst én ting, kortet skal kunne.");
    if (useReferrals && !friend.trim()) return fail("friend", "Skriv hvad vennen får, eller vælg et forslag.");
    if (useReferrals && !referrer.trim()) return fail("referrer", "Skriv hvad kunden får, eller vælg et forslag.");
    if (useStamps && reward.trim().length < 2) return fail("reward", "Skriv belønningen, eller vælg et forslag.");
    if (!email.trim()) return fail("email", "Skriv din e-mail.");
    if (!acceptedTerms) return fail("terms", "Accepter betingelserne for at oprette din butik.");
    setBusy(true);
    try {
      const res = await createLoyaltyBusinessAction({
        name: businessName,
        email,
        referral: useReferrals ? { friendReward: friend, referrerReward: referrer } : null,
        stamps: useStamps ? { rewardText: reward, stampsRequired: stamps, stampIcon: icon } : null,
        acceptedTerms,
      });
      if (res.ok) {
        if (res.loginToken) setLoginToken(res.loginToken);
        else setLinkSentTo(email.trim());
        return;
      }
      setError(res.error);
    } catch {
      setError("Noget gik galt. Prøv igen om lidt.");
    }
    setBusy(false);
  }

  const name = businessName.trim() || "Din butik";
  const preview = (
    <WalletCardPreview
      os="27"
      style={useStamps ? "stamps" : "color"}
      artwork={null}
      primaryColor={DEFAULT_PRIMARY}
      textColor={DEFAULT_TEXT}
      logoUrl={null}
      name={name}
      stampIcon={icon}
      stampsRequired={stamps}
      rewardText={reward.trim() || "Din belønning"}
      product={useStamps && useReferrals ? "begge" : useReferrals ? "henvisninger" : "stemplet"}
      friendReward={friend.trim() || "rabat"}
      referrerReward={lower(referrer.trim()) || "en belønning"}
      actions={[]}
      fresh
    />
  );

  return (
    <div className="dash-theme min-h-screen bg-white text-[#0B1628] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Folka Kort, til forsiden">
          <KundekortMark />
        </Link>
        <span className="text-[13px] text-[#0B1628]/60">Tre måneder gratis.</span>
      </header>

      {linkSentTo ? (
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <FolkaLogo className="h-14" />
          <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.03em]">{businessName.trim()} er klar.</h1>
          <p className="mt-3 text-[18px] text-[#0B1628]/60">
            Du har allerede et login med {linkSentTo}. Vi har sendt et login-link til den mail. Åbn det, så kommer du ind i din nye butik.
          </p>
        </main>
      ) : loginToken ? (
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <Confetti colors={["#061C3D", "#1B5EAE", "#7CC4FF", "#C8D8E8"]} />
          <FolkaLogo className="h-14" />
          <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.03em]">{businessName.trim()} er klar.</h1>
          <p className="mt-3 text-[18px] text-[#0B1628]/60">Vi åbner dit dashboard.</p>
          <form ref={loginForm} action={loginWithOnboardingToken} className="mt-8">
            <input type="hidden" name="token" value={loginToken} />
            <input type="hidden" name="dest" value="/app" />
            <button type="submit" className="rounded-full bg-[#061C3D] px-7 py-3.5 text-[17px] font-semibold text-white hover:bg-[#0A2D5A]">
              Gå til dashboardet
            </button>
          </form>
        </main>
      ) : (
        <main className="mx-auto grid max-w-[1120px] gap-14 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pt-14">
          <div className="max-w-[560px]">
            <h1 className="text-[36px] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">Lav dit loyalitetskort.</h1>
            <p className="mt-4 text-[19px] text-[#0B1628]/55">Kunderne kommer igen og tager vennerne med. Klar på et minut.</p>

            <form onSubmit={submit} className="mt-10 flex flex-col gap-8">
              <label className="block">
                <Label>Virksomhed</Label>
                <input
                  {...fieldRef("name")}
                  className={inputCls}
                  value={businessName}
                  maxLength={60}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    clearError("name");
                  }}
                  autoComplete="organization"
                />
                {fieldError("name")}
              </label>

              <fieldset>
                <legend className="mb-1 text-[22px] font-bold tracking-[-0.02em]">Hvad skal kortet kunne?</legend>
                <p className="mb-4 text-[15px] text-[#0B1628]/60">Vælg begge, eller start med én. Du kan altid tilføje mere.</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ModuleTile
                    on={useReferrals}
                    onToggle={() => setUseReferrals((v) => !v)}
                    title="Henvisninger"
                    text="Kunderne tager vennerne med."
                    icon={
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="8" r="3.5" />
                        <path d="M3 20c.8-3.4 3.2-5 6-5s5.2 1.6 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.7 2.3 3 5" />
                      </svg>
                    }
                  />
                  <ModuleTile
                    on={useStamps}
                    onToggle={() => setUseStamps((v) => !v)}
                    title="Stempler"
                    text="Kunderne kommer igen."
                    icon={<StampIcon icon={icon} className="h-5 w-5" />}
                  />
                </div>
              </fieldset>

              {useReferrals ? (
                <fieldset className="animate-step">
                  <legend className="mb-3 text-[19px] font-bold tracking-[-0.02em]">Henvisninger</legend>
                  <div className="flex flex-col gap-5">
                    <label className="block">
                      <Label>Vennen får ved første besøg</Label>
                      <input {...fieldRef("friend")} className={inputCls} value={friend} maxLength={40} onChange={(e) => { setFriend(e.target.value); clearError("friend"); }} />
                      {fieldError("friend")}
                      <Chips items={FRIEND_SUGGESTIONS} onPick={(v) => { setFriend(v); clearError("friend"); }} />
                    </label>
                    <label className="block">
                      <Label>Kunden får, når vennen har været der</Label>
                      <input {...fieldRef("referrer")} className={inputCls} value={referrer} maxLength={40} onChange={(e) => { setReferrer(e.target.value); clearError("referrer"); }} />
                      {fieldError("referrer")}
                      <Chips items={REFERRER_SUGGESTIONS} onPick={(v) => { setReferrer(v); clearError("referrer"); }} />
                    </label>
                  </div>
                </fieldset>
              ) : null}

              {useStamps ? (
                <fieldset className="animate-step">
                  <legend className="mb-3 text-[19px] font-bold tracking-[-0.02em]">Stempler</legend>
                  <label className="block">
                    <Label>Belønning, når kortet er fuldt</Label>
                    <input {...fieldRef("reward")} className={inputCls} value={reward} maxLength={REWARD_MAX} onChange={(e) => { setReward(e.target.value); clearError("reward"); }} />
                    {fieldError("reward")}
                    <Chips items={STAMP_SUGGESTIONS} onPick={(v) => { setReward(v); clearError("reward"); }} />
                  </label>

                  <div className="mt-5 flex items-center justify-between gap-4 rounded-[14px] bg-[#F2F5F9] px-4 py-3">
                    <span className="text-[17px]">Antal stempler</span>
                    <span className="flex items-center gap-3">
                      <button
                        type="button"
                        aria-label="Færre stempler"
                        disabled={stamps <= MIN}
                        onClick={() => setStamps((n) => Math.max(MIN, n - 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[20px] leading-none shadow-sm disabled:opacity-40"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-[19px] font-semibold tabular-nums">{stamps}</span>
                      <button
                        type="button"
                        aria-label="Flere stempler"
                        disabled={stamps >= MAX}
                        onClick={() => setStamps((n) => Math.min(MAX, n + 1))}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[20px] leading-none shadow-sm disabled:opacity-40"
                      >
                        +
                      </button>
                    </span>
                  </div>

                  <p className="mb-2 mt-5 text-[14px] font-medium text-[#0B1628]/60">Stempel</p>
                  <div className="grid grid-cols-6 gap-2">
                    {(allIcons ? STAMP_ICONS.filter((i) => i.key !== "custom") : ICONS).map((i) => (
                      <button
                        key={i.key}
                        type="button"
                        aria-label={i.label}
                        aria-pressed={icon === i.key}
                        onClick={() => setIcon(i.key)}
                        className={cn(
                          "flex aspect-square items-center justify-center rounded-[14px] transition-colors",
                          icon === i.key ? "bg-[#061C3D] text-white" : "bg-[#F2F5F9] text-[#0B1628]/70 hover:bg-[#ECECEF]",
                        )}
                      >
                        <StampIcon icon={i.key} className="h-6 w-6" />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllIcons((v) => !v)}
                    aria-expanded={allIcons}
                    className="mt-3 inline-flex min-h-10 items-center rounded-full border border-[#0B1628]/15 px-4 text-[14px] font-medium text-[#0B1628] hover:border-[#0B1628]/40"
                  >
                    {allIcons ? "Vis færre ikoner" : `Se alle ${STAMP_ICONS.length - 1} ikoner`}
                  </button>
                </fieldset>
              ) : null}

              <label className="block">
                <Label>Din e-mail</Label>
                <input
                  {...fieldRef("email")}
                  className={inputCls}
                  type="email"
                  value={email}
                  maxLength={120}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError("email");
                  }}
                  autoComplete="email"
                />
                {fieldError("email")}
              </label>

              <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-[#0B1628]/70">
                <input
                  {...fieldRef("terms")}
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    clearError("terms");
                  }}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#061C3D]"
                />
                <span>
                  Jeg accepterer{" "}
                  <a href="/handelsbetingelser" target="_blank" rel="noreferrer" className="text-[#0B1628] underline underline-offset-2">
                    handelsbetingelserne
                  </a>
                  ,{" "}
                  <a href="/privatliv" target="_blank" rel="noreferrer" className="text-[#0B1628] underline underline-offset-2">
                    privatlivspolitikken
                  </a>{" "}
                  og{" "}
                  <a href="/databehandleraftale" target="_blank" rel="noreferrer" className="text-[#0B1628] underline underline-offset-2">
                    databehandleraftalen
                  </a>
                  .
                </span>
              </label>

              {/* Fejl ved et felt staar ved feltet; her kun de generelle (og fra serveren). */}
              {error && (errorField === null || errorField === "terms") ? (
                <p role="alert" className="text-[15px] text-rust">
                  {error}
                </p>
              ) : null}

              {/* Paa mobil: kortet lige over knappen (paa computer staar det til hoejre). */}
              <div className="lg:hidden">
                <p className="mb-3 text-center text-[14px] font-medium text-[#0B1628]/60">Sådan ser kunderne det</p>
                {preview}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#061C3D] px-8 text-[17px] font-semibold text-white transition-[transform,background-color] hover:bg-[#0A2D5A] active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                >
                  {busy ? "Opretter dit kort..." : "Opret mit kort"}
                </button>
                <p className="mt-3 text-[13px] text-[#0B1628]/60">Farver, logo og motiv vælger du bagefter under Design.</p>
              </div>
            </form>
          </div>

          <aside className="hidden w-[320px] lg:block">
            <div className="sticky top-10">
              {preview}
              <p className="mt-4 text-center text-[15px] text-[#0B1628]/60">Sådan ser kunderne det</p>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
