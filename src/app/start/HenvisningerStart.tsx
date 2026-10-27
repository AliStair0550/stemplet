"use client";

import { useState } from "react";
import Link from "next/link";
import { HenvisningerLogo } from "@/components/ProductLogo";
import { Phone } from "@/components/henvisninger-site/Screens";
import { Scribble, hand } from "@/components/henvisninger-site/Hand";

// "Kom i gang" med Henvisninger som udgangspunkt (/start?produkt=henvisninger), i
// Henvisningers eget udtryk. Ved siden af formularen viser en iPhone butikkens
// henvisningsside live, mens man skriver. Stempelkortet er et frivilligt "+".
// Samme anmodning som Stemplets formular (/api/start-request): Ali opretter
// butikken og vender tilbage.

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif';
const INK = "#111";

const inputCls =
  "min-h-[52px] w-full rounded-[14px] bg-[#F5F5F7] px-4 text-[17px] text-[#111] outline-none transition-shadow placeholder:text-[#111]/35 focus:ring-2 focus:ring-[#111]";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[14px] font-medium text-[#111]/60">{children}</span>;
}

export function HenvisningerStart() {
  const [businessName, setBusinessName] = useState("");
  const [friend, setFriend] = useState("");
  const [referrer, setReferrer] = useState("");
  const [wantsStamps, setWantsStamps] = useState(false);
  const [stampReward, setStampReward] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

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
    if (wantsStamps && !stampReward.trim()) {
      setError("Skriv stempelkortets belønning, eller fjern stempelkortet.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/start-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessName,
          reward: wantsStamps ? stampReward : "",
          wantsReferrals: true,
          wantsStamps,
          referralReward: `Ven får: ${friend.trim()}. Kunden får: ${referrer.trim()}.`,
          contactName,
          email,
          phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) setDone(true);
      else setError(data?.message ?? "Noget gik galt. Prøv igen om lidt.");
    } catch {
      setError("Kunne ikke sende lige nu. Tjek forbindelsen og prøv igen.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-white text-[#111] antialiased" style={{ fontFamily: FONT }}>
      <header className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4 sm:px-6">
        <Link href="/henvisninger" aria-label="Henvisninger, til forsiden" className="relative inline-block pb-[0.32em] text-[#111]">
          <HenvisningerLogo className="h-[30px] sm:h-[34px]" />
          <Scribble className="absolute bottom-0 left-[14%] h-[0.42em] w-[90%]" />
        </Link>
        <span className="text-[13px] text-[#111]/50">Gratis. Intet kreditkort.</span>
      </header>

      {done ? (
        <main className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center sm:px-6">
          <p className={`${hand.className} text-[88px] leading-none`}>Tak</p>
          <Scribble className="-mt-1 h-4 w-[180px]" />
          <h1 className="mt-8 text-[30px] font-bold leading-tight tracking-[-0.03em]">Vi har fået det.</h1>
          <p className="mt-3 text-[18px] text-[#111]/60">
            Vi sætter din henvisningsside op og vender tilbage på {email.trim()}. Spørgsmål kan sendes til hej@alius.dk.
          </p>
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
            <p className="mt-4 text-[19px] text-[#111]/55">Lav din rabatordning. Vi sætter resten op sammen med dig.</p>

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
                <p className="mt-2 text-[14px] text-[#111]/50">Du bestemmer selv, og det kan ændres når som helst.</p>
              </fieldset>

              <div>
                <button
                  type="button"
                  onClick={() => setWantsStamps((v) => !v)}
                  aria-pressed={wantsStamps}
                  className={`flex w-full items-center gap-4 rounded-[18px] border px-5 py-4 text-left transition-colors ${
                    wantsStamps ? "border-[#111] bg-white" : "border-dashed border-[#111]/25 hover:border-[#111]/60"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[20px] leading-none transition-colors ${
                      wantsStamps ? "bg-[#111] text-white" : "border border-[#111]/25 text-[#111]/60"
                    }`}
                  >
                    {wantsStamps ? "✓" : "+"}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] font-semibold">Tilføj stempelkort</span>
                    <span className="block text-[14px] text-[#111]/55">
                      Få de nye kunder til at komme igen. Kan også slås til senere i dashboardet.
                    </span>
                  </span>
                </button>
                {wantsStamps ? (
                  <label className="mt-3 block">
                    <Label>Stempelkortets belønning</Label>
                    <input
                      className={inputCls}
                      value={stampReward}
                      maxLength={300}
                      onChange={(e) => setStampReward(e.target.value)}
                      placeholder="Fx 10. klip gratis"
                    />
                  </label>
                ) : null}
              </div>

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
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      className={inputCls}
                      value={contactName}
                      maxLength={80}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Navn (valgfrit)"
                      autoComplete="name"
                      aria-label="Navn"
                    />
                    <input
                      className={inputCls}
                      type="tel"
                      value={phone}
                      maxLength={40}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Telefon (valgfrit)"
                      autoComplete="tel"
                      aria-label="Telefon"
                    />
                  </div>
                </div>
              </fieldset>

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
                  {busy ? "Sender" : "Kom i gang"}
                </button>
                <p className="mt-3 text-[13px] text-[#111]/45">
                  Vi bruger kun dine oplysninger til at sætte din butik op og kontakte dig.
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
      <div className="rounded-[16px] bg-[#111] px-4 pb-4 pt-5 text-center text-white">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[12px] bg-white text-[15px] font-bold text-[#111]">
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
          <div key={l} className="rounded-[10px] bg-[#F5F5F7] px-2.5 py-2">
            <p className="text-[9.5px] text-[#111]/55">{l}</p>
            <p className="mt-0.5 break-words text-[13px] font-semibold leading-tight first-letter:uppercase">{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        <div className="h-[30px] rounded-[8px] bg-[#F5F5F7]" />
        <div className="h-[30px] rounded-[8px] bg-[#F5F5F7]" />
      </div>
      <div className="mt-auto rounded-full bg-[#111] py-2.5 text-center text-[12px] font-semibold text-white">Få mit link</div>
    </div>
  );
}
