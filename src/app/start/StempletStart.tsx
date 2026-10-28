"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { StempletLogo } from "@/components/ProductLogo";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import { Phone } from "@/components/henvisninger-site/Screens";
import type { StampIconKey } from "@/lib/brand";
import { createStampBusinessAction, loginWithOnboardingToken } from "./actions";

// "Kom i gang" med Stemplet (/start): samme udtryk og samme lethed som
// Henvisninger. Belønning, antal stempler og ikon; en iPhone viser kortet live.
// Butikken oprettes med det samme, og ejeren logges direkte ind paa Stemplets
// overblik, hvor linket og QR-koden ligger klar. Farver og logo under Design.

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';
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

const SUGGESTIONS = ["Gratis kaffe", "Gratis klip", "50 kr. rabat", "En på huset"];

const inputCls =
  "min-h-[52px] w-full rounded-[14px] bg-[#F5F5F7] px-4 text-[17px] text-[#111] outline-none transition-shadow placeholder:text-[#111]/35 focus:ring-2 focus:ring-[#111]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[14px] font-medium text-[#111]/60">{children}</span>;
}

export function StempletStart() {
  const [businessName, setBusinessName] = useState("");
  const [reward, setReward] = useState("");
  const [stamps, setStamps] = useState(10);
  const [icon, setIcon] = useState<StampIconKey>("coffee");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const loginForm = useRef<HTMLFormElement>(null);

  // Oprettet: log direkte ind paa Stemplets overblik.
  useEffect(() => {
    if (loginToken) loginForm.current?.requestSubmit();
  }, [loginToken]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!businessName.trim() || !email.trim()) {
      setError("Udfyld virksomhed og e-mail.");
      return;
    }
    if (reward.trim().length < 2) {
      setError("Skriv belønningen på kortet.");
      return;
    }
    if (!acceptedTerms) {
      setError("Accepter betingelserne for at oprette din butik.");
      return;
    }
    setBusy(true);
    try {
      const res = await createStampBusinessAction({
        name: businessName,
        email,
        contactName,
        rewardText: reward,
        stampsRequired: stamps,
        stampIcon: icon,
        acceptedTerms,
      });
      if (res.ok) {
        setLoginToken(res.loginToken);
        return;
      }
      setError(res.error);
    } catch {
      setError("Noget gik galt. Prøv igen om lidt.");
    }
    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/stemplet" aria-label="Stemplet, til forsiden">
          <StempletLogo className="text-[1.6rem]" />
        </Link>
        <span className="text-[13px] text-[#111]/50">Gratis. Intet kreditkort.</span>
      </header>

      {loginToken ? (
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <StempletLogo className="text-[3rem]" />
          <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.03em]">{businessName.trim()} er klar.</h1>
          <p className="mt-3 text-[18px] text-[#111]/60">Vi åbner dit dashboard.</p>
          <form ref={loginForm} action={loginWithOnboardingToken} className="mt-8">
            <input type="hidden" name="token" value={loginToken} />
            <input type="hidden" name="dest" value="/app/stemplet" />
            <button type="submit" className="rounded-full bg-[#111] px-7 py-3.5 text-[17px] font-semibold text-white hover:bg-black">
              Gå til dashboardet
            </button>
          </form>
        </main>
      ) : (
        <main className="mx-auto grid max-w-[1120px] gap-14 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pt-14">
          <div className="max-w-[560px]">
            <h1 className="text-[36px] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">
              Få dine kunder til at komme igen.
            </h1>
            <p className="mt-4 text-[19px] text-[#111]/55">Lav dit stempelkort, så er det klar på et minut.</p>

            <form onSubmit={submit} className="mt-10 flex flex-col gap-8">
              <label className="block">
                <Label>Virksomhed</Label>
                <input
                  className={inputCls}
                  value={businessName}
                  maxLength={60}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Fx Café Nord"
                  autoComplete="organization"
                />
              </label>

              <fieldset>
                <legend className="mb-3 text-[22px] font-bold tracking-[-0.02em]">Dit stempelkort</legend>
                <label className="block">
                  <Label>Belønning, når kortet er fuldt</Label>
                  <input
                    className={inputCls}
                    value={reward}
                    maxLength={REWARD_MAX}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="Fx gratis kaffe"
                  />
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReward(s)}
                      className="rounded-full border border-[#111]/15 px-3 py-1.5 text-[13px] text-[#111]/70 hover:border-[#111]/50"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <div className="mt-5 flex items-center justify-between gap-4 rounded-[14px] bg-[#F5F5F7] px-4 py-3">
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

                <p className="mb-2 mt-5 text-[14px] font-medium text-[#111]/60">Stempel</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICONS.map((i) => (
                    <button
                      key={i.key}
                      type="button"
                      aria-label={i.label}
                      aria-pressed={icon === i.key}
                      onClick={() => setIcon(i.key)}
                      className={`flex aspect-square items-center justify-center rounded-[14px] transition-colors ${
                        icon === i.key ? "bg-[#111] text-white" : "bg-[#F5F5F7] text-[#111]/70 hover:bg-[#ECECEF]"
                      }`}
                    >
                      <StampIcon icon={i.key} className="h-6 w-6" />
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[14px] text-[#111]/50">Farver og logo vælger du bagefter under Design.</p>
              </fieldset>

              <fieldset>
                <legend className="mb-3 text-[22px] font-bold tracking-[-0.02em]">Dig</legend>
                <div className="flex flex-col gap-3">
                  <input
                    className={inputCls}
                    type="email"
                    value={email}
                    maxLength={120}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@mail.dk"
                    autoComplete="email"
                    aria-label="E-mail"
                  />
                  <input
                    className={inputCls}
                    value={contactName}
                    maxLength={80}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Dit navn (valgfrit)"
                    autoComplete="name"
                    aria-label="Navn"
                  />
                </div>
              </fieldset>

              <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-[#111]/70">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 accent-[#111]"
                />
                <span>
                  Jeg accepterer{" "}
                  <a href="/handelsbetingelser" target="_blank" rel="noreferrer" className="text-[#111] underline underline-offset-2">
                    handelsbetingelserne
                  </a>
                  ,{" "}
                  <a href="/privatliv" target="_blank" rel="noreferrer" className="text-[#111] underline underline-offset-2">
                    privatlivspolitikken
                  </a>{" "}
                  og{" "}
                  <a href="/databehandleraftale" target="_blank" rel="noreferrer" className="text-[#111] underline underline-offset-2">
                    databehandleraftalen
                  </a>
                  .
                </span>
              </label>

              {error ? (
                <p role="alert" className="text-[15px] text-rust">
                  {error}
                </p>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#111] px-8 text-[17px] font-semibold text-white transition-[transform,background-color] hover:bg-black active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                >
                  {busy ? "Opretter" : "Opret min butik"}
                </button>
                <p className="mt-3 text-[13px] text-[#111]/45">Vi bruger dine oplysninger til at sætte din butik op.</p>
                <p className="mt-6 text-[15px] text-[#111]/60">
                  Vil du hellere have dine kunder til at henvise dig?{" "}
                  <Link href="/start?produkt=henvisninger" className="font-medium text-[#111] underline underline-offset-2">
                    Kom i gang med Henvisninger
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-10">
              <Phone>
                <div className="flex flex-1 flex-col bg-[#F5F5F7] px-3.5 pb-8 pt-14">
                  <p className="text-center text-[13px] font-semibold">{businessName.trim() || "Din butik"}</p>
                  <p className="mb-4 text-center text-[11px] text-[#111]/50">Dit stempelkort</p>
                  {/* Kortet er tegnet til fuld bredde; zoom saa det passer i telefonen. */}
                  <div style={{ zoom: 0.72 }}>
                    <StampCard
                      businessName={businessName.trim() || "Din butik"}
                      stampIcon={icon}
                      stamps={Math.min(3, stamps)}
                      required={stamps}
                      rewardText={reward.trim() || "Gratis kaffe"}
                    />
                  </div>
                  <div className="mt-auto rounded-full bg-[#111] py-2.5 text-center text-[12px] font-semibold text-white">
                    Tilføj til Apple Wallet
                  </div>
                </div>
              </Phone>
              <p className="mt-6 text-center text-[15px] text-[#111]/50">Sådan ser kunderne det</p>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}
