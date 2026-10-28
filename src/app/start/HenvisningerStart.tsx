"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { KundekortMark } from "@/components/ProductLogo";
import { Phone } from "@/components/henvisninger-site/Screens";
import { Scribble, hand } from "@/components/henvisninger-site/Hand";
import { createReferralBusinessAction, loginWithOnboardingToken } from "./actions";

// "Kom i gang" med Henvisninger som udgangspunkt (/start?produkt=henvisninger), i
// Henvisningers eget udtryk. Ved siden af formularen viser en iPhone butikkens
// henvisningsside live, mens man skriver. Kun Henvisninger aktiveres; Stemplet
// kan butikken selv slaa til i dashboardet senere.
// Selvbetjent: butikken oprettes straks med rabatordningen, og ejeren logges
// direkte ind paa Henvisninger i dashboardet (onboarding-token, som Stemplets
// tidligere oprettelse).

const FONT = 'var(--font-kk), -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';
const INK = "#061C3D";

const inputCls =
  "min-h-[52px] w-full rounded-[14px] bg-[#F2F5F9] px-4 text-[17px] text-[#0B1628] outline-none transition-shadow placeholder:text-[#0B1628]/35 focus:ring-2 focus:ring-[#1B5EAE]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[14px] font-medium text-[#0B1628]/60">{children}</span>;
}

export function HenvisningerStart() {
  const [businessName, setBusinessName] = useState("");
  const [friend, setFriend] = useState("");
  const [referrer, setReferrer] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginToken, setLoginToken] = useState<string | null>(null);
  const loginForm = useRef<HTMLFormElement>(null);

  // Oprettet: log direkte ind paa Henvisninger i dashboardet.
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
    if (!friend.trim() || !referrer.trim()) {
      setError("Skriv hvad vennen og kunden får.");
      return;
    }
    if (!acceptedTerms) {
      setError("Accepter betingelserne for at oprette din butik.");
      return;
    }
    setBusy(true);
    try {
      const res = await createReferralBusinessAction({
        name: businessName,
        email,
        contactName,
        friendReward: friend,
        referrerReward: referrer,
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
    <div className="dash-theme min-h-screen bg-white text-[#0B1628] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Kundekort, til forsiden">
          <KundekortMark />
        </Link>
        <span className="text-[13px] text-[#0B1628]/50">Gratis. Intet kreditkort.</span>
      </header>

      {loginToken ? (
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <p className={`${hand.className} text-[88px] leading-none`}>Velkommen</p>
          <Scribble className="-mt-1 h-4 w-[260px]" />
          <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.03em]">{businessName.trim()} er klar.</h1>
          <p className="mt-3 text-[18px] text-[#0B1628]/60">Vi åbner dit dashboard.</p>
          <form ref={loginForm} action={loginWithOnboardingToken} className="mt-8">
            <input type="hidden" name="token" value={loginToken} />
            <input type="hidden" name="dest" value="/app/henvisninger" />
            <button type="submit" className="rounded-full bg-[#061C3D] px-7 py-3.5 text-[17px] font-semibold text-white hover:bg-[#0A2D5A]">
              Gå til dashboardet
            </button>
          </form>
        </main>
      ) : (
        <main className="mx-auto grid max-w-[1120px] gap-14 px-4 pb-24 pt-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:gap-20 lg:pt-14">
          <div className="max-w-[560px]">
            <h1 className="text-[36px] font-bold leading-[1.04] tracking-[-0.04em] sm:text-[48px]">
              Kom i gang med{" "}
              <span className={`${hand.className} relative inline-block font-normal tracking-normal`} style={{ fontSize: "1.1em" }}>
                Henvisninger.
              </span>
            </h1>
            <p className="mt-4 text-[19px] text-[#0B1628]/55">Lav din rabatordning, så er din side klar på et minut.</p>

            <form onSubmit={submit} className="mt-10 flex flex-col gap-8">
              <label className="block">
                <Label>Virksomhed</Label>
                <input
                  className={inputCls}
                  value={businessName}
                  maxLength={120}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Fx Salon Nord"
                  autoComplete="organization"
                />
              </label>

              <fieldset>
                <legend className="mb-3 text-[22px] font-bold tracking-[-0.02em]">Din rabatordning</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <Label>Ven får ved første besøg</Label>
                    <input
                      className={inputCls}
                      value={friend}
                      maxLength={100}
                      onChange={(e) => setFriend(e.target.value)}
                      placeholder="Fx 100 kr."
                    />
                  </label>
                  <label className="block">
                    <Label>Kunden får, når vennen har været der</Label>
                    <input
                      className={inputCls}
                      value={referrer}
                      maxLength={100}
                      onChange={(e) => setReferrer(e.target.value)}
                      placeholder="Fx gratis klip"
                    />
                  </label>
                </div>
                <p className="mt-2 text-[14px] text-[#0B1628]/50">Du bestemmer selv, og det kan ændres når som helst.</p>
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

              <label className="flex cursor-pointer items-start gap-3 text-[15px] leading-snug text-[#0B1628]/70">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
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

              {error ? (
                <p role="alert" className="text-[15px] text-rust">
                  {error}
                </p>
              ) : null}

              <div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#061C3D] px-8 text-[17px] font-semibold text-white transition-[transform,background-color] hover:bg-[#0A2D5A] active:scale-[0.98] disabled:opacity-60 sm:w-auto"
                >
                  {busy ? "Opretter" : "Opret min butik"}
                </button>
                <p className="mt-3 text-[13px] text-[#0B1628]/45">
                  Vi bruger dine oplysninger til at sætte din butik op.
                </p>
              </div>
            </form>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-10">
              <Phone>
                <Preview
                  shop={businessName.trim() || "Din butik"}
                  friend={friend.trim() || "100 kr."}
                  referrer={referrer.trim() || "gratis klip"}
                />
              </Phone>
              <p className={`${hand.className} mt-6 text-center text-[24px]`}>din side, live</p>
            </div>
          </aside>
        </main>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Butikkens henvisningsside i miniformat (som /henvisninger/[butik]). */
function Preview({ shop, friend, referrer }: { shop: string; friend: string; referrer: string }) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-8 pt-12 text-left" style={{ color: INK }}>
      <div className="rounded-[16px] bg-[#061C3D] px-4 pb-4 pt-5 text-center text-white">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[15px] font-bold text-[#0B1628]">
          {initials(shop)}
        </span>
        <p className="mt-2 truncate text-[15px] font-semibold">{shop}</p>
        <p className="text-[10.5px] text-white/70">Anbefal os til en ven</p>
      </div>
      <p className="mt-4 text-center text-[17px] font-semibold tracking-[-0.01em]">Henvis en ven</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          ["Din ven får", friend],
          ["Du får", referrer],
        ].map(([l, v]) => (
          <div key={l} className="rounded-[10px] bg-[#F2F5F9] px-2.5 py-2">
            <p className="text-[9.5px] text-[#0B1628]/55">{l}</p>
            <p className="mt-0.5 break-words text-[13px] font-semibold leading-tight first-letter:uppercase">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-[30px] rounded-[8px] bg-[#F2F5F9]" />
        <div className="h-[30px] rounded-[8px] bg-[#F2F5F9]" />
      </div>
      <div className="mt-auto rounded-full bg-[#061C3D] py-2.5 text-center text-[12px] font-semibold text-white">Få mit link</div>
    </div>
  );
}
