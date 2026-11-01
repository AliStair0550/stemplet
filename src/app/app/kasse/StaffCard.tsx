"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ReferralCheckIn, prefetchDeskCustomer } from "@/components/referral/ReferralCheckIn";
import { StampCard } from "@/components/StampCard";
import { StampIcon } from "@/components/StampIcon";
import { Celebration } from "@/components/Celebration";
import { btnClass, CtaGlow, CTA_EMPHASIS } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { StampIconKey } from "@/lib/brand";

// Det scannede kort ved kassen: giv stempel, indloes en beloenning, fortryd.

// fetch med timeout: en STALLED forbindelse (ikke fejlet) faar ellers loeftet
// aldrig til at settle, saa den primaere knap haenger paa "Et oejeblik..." for
// evigt. Efter timeout afbrydes kaldet og catch'et viser "prOv igen"-noten.
// Sikkert paa stempel/redeem, fordi begge er idempotente/atomiske server-side.
function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  ms = 12000,
): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...init, signal: ctrl.signal }).finally(() =>
    clearTimeout(t),
  );
}

// Kort haptik paa personalets enhed (telefon/tablet). Valgfrit.
function haptic(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // haptik er valgfrit
  }
}

// Unik noegle pr. stempel-handling. Bruges til server-side idempotens: samme
// noegle paa et retry (fx tabt svar paa daarligt wifi) giver ikke et ekstra
// stempel. Fallback hvis crypto.randomUUID ikke findes (meget gamle browsere).
function newIdemKey(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// Gave-glyf til indloesnings-fejringen ("giv beloenningen nu").
function GiftGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

// ── Delt: det scannede kort + giv stempel / indløs ────────────────────
type CardState = {
  serial: string;
  /** Kundens navn (null paa aeldre kort uden navn). */
  name?: string | null;
  stamps: number;
  required: number;
  rewardReady: boolean;
  rewardText: string;
  stampIcon: string;
  primaryColor: string;
  textColor: string;
  businessName: string;
  // Livstid: samlet antal stempler kunden nogensinde har optjent hos butikken.
  lifetimeStamps: number;
};

export function StaffCard({
  serial,
  logoSrc,
  hasPin,
  referrals,
  onRescan,
  onExit,
}: {
  serial: string;
  logoSrc: string | null;
  hasPin: boolean;
  referrals: boolean;
  onRescan: () => void;
  onExit: () => void;
}) {
  const [card, setCard] = useState<CardState | null>(null);
  const [loading, setLoading] = useState(true);
  // Hvorfor kort-opslaget fejlede: "offline" (kan proeves igen) vs "notfound"
  // (forkert kort, ny scanning kraeves). Styrer den tomme tilstand nedenfor.
  const [loadError, setLoadError] = useState<"offline" | "notfound" | null>(
    null,
  );
  const [pin, setPin] = useState("");
  // Antal stempler personalet giver paa denne scanning (fx tre kaffe = 3).
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  // Synkron guard: to hurtige tryk (touch double-tap) kan begge naa at fyre
  // onClick FOER React har sat disabled i DOM'en. En ref tjekkes/saettes
  // synkront og lukker det vindue, saa man aldrig giver to stempler paa eet tryk.
  const busyRef = useRef(false);
  // Idempotens-noegle for det NUVAERENDE stempel. Roteres foerst naar vi faar et
  // endeligt svar; beholdes ved tabt forbindelse, saa et nyt tryk deduplikeres
  // server-side i stedet for at give kunden et ekstra stempel.
  const stampKeyRef = useRef(newIdemKey());
  // Samme rolle for indloesning: samme noegle paa et retry, saa en tabt-svar-
  // gentagelse ikke laeser som "kortet er ikke fuldt endnu".
  const redeemKeyRef = useRef(newIdemKey());
  // Og for fortryd: samme noegle paa et retry fjerner ikke et ekstra stempel.
  const undoKeyRef = useRef(newIdemKey());
  // Stiger for hvert stempel: bruges som key til at gen-udloese kortets
  // "burst"-animation og den flyvende "+1", saa personalet faar en tydelig
  // kvittering paa skaermen (Wallet-pass'et opdaterer Apple lidt senere).
  const [pulse, setPulse] = useState(0);
  // Hvor mange stempler seneste tryk gav (normalt 1, 2 ved dobbeltstempel-kampagne).
  const [lastInc, setLastInc] = useState(1);
  // Kortet blev fuldt paa dette tryk: kassens stoerste oejeblik, fejres.
  const [justFilled, setJustFilled] = useState(false);
  // Kvittering efter et stempel: hvor mange der blev givet, og hvor kortet staar.
  // Erstatter "Giv stempel", saa det er tydeligt, at stemplet ER givet.
  const [given, setGiven] = useState<{ inc: number; stamps: number; required: number } | null>(null);
  // Naar en beloenning lige er indloest: stor fejring + "giv beloenningen nu".
  // Baerer de reelle rest-stempler, saa kortet kan opdateres uden et ekstra kald.
  const [redeemed, setRedeemed] = useState<{
    rewardText: string;
    stamps: number;
    required: number;
  } | null>(null);

  const loadCard = useCallback(async (s: string) => {
    setLoading(true);
    setNote(null);
    setLoadError(null);
    try {
      const res = await fetchWithTimeout(
        `/api/staff/card?serial=${encodeURIComponent(s)}`,
        { cache: "no-store" },
      );
      const data = await res.json();
      if (res.ok) {
        setCard(data as CardState);
      } else {
        setCard(null);
        setLoadError("notfound");
        setNote({ ok: false, text: data.message ?? "Kortet blev ikke fundet." });
      }
    } catch {
      setCard(null);
      setLoadError("offline");
      setNote({ ok: false, text: "Tjek forbindelsen og prøv igen." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Henvisningsoplysningerne hentes samtidig med kortet (se ReferralCheckIn).
    if (referrals) prefetchDeskCustomer(serial);
    loadCard(serial);
  }, [serial, loadCard, referrals]);

  async function giveStamp() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetchWithTimeout("/api/staff/stamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serial: card.serial,
          count: qty,
          // Samme noegle paa et retry -> server-side dedup (ingen dobbelt stempel).
          idempotencyKey: stampKeyRef.current,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Et identisk forsoeg behandles stadig. Behold noeglen, saa et nyt tryk
        // henter DET foerste resultat i stedet for at stemple igen.
        setNote({
          ok: false,
          text: data.message ?? "Stemplet behandles. Prøv igen om lidt.",
        });
        return;
      }
      // Vi fik et endeligt svar -> naeste stempel er en NY handling.
      stampKeyRef.current = newIdemKey();
      if (res.ok) {
        // Opdater kortet DIREKTE fra svaret, ingen ekstra hentning: personalet
        // ser stemplet med det samme (foer var der to kald i traek = langsomt).
        setCard({
          ...card,
          stamps: data.stamps,
          rewardReady: data.rewardReady,
          lifetimeStamps: data.lifetimeStamps ?? card.lifetimeStamps,
        });
        setLastInc(data.increment ?? 1);
        setPulse((p) => p + 1);
        setJustFilled(!!data.rewardReady);
        setGiven(data.rewardReady ? null : { inc: data.increment ?? 1, stamps: data.stamps, required: data.required });
        setQty(1);
        haptic(data.rewardReady ? [30, 50, 30, 50, 90] : [16, 45, 22]);
        // Almindeligt stempel: kvitteringen herunder siger det hele. Fuldt kort: en linje.
        setNote(data.rewardReady ? { ok: true, text: "Kortet er nu fuldt. Belønning klar." } : null);
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke stemple." });
        // Kortet var maaske allerede fuldt (en anden enhed stemplede) -> hent
        // den aktuelle tilstand, saa knappen matcher virkeligheden igen.
        if (data.code === "FULL") await loadCard(card.serial);
      }
    } catch {
      // Intet svar (daarligt wifi): BEHOLD noeglen, saa et nyt tryk deduplikeres
      // server-side i stedet for at give kunden et ekstra stempel.
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function redeem() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetchWithTimeout("/api/staff/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serial: card.serial,
          // PIN sendes kun, hvis butikken kraever en (ellers udeladt).
          pin: pin || undefined,
          // Samme noegle paa et retry -> server-side dedup (samme resultat).
          idempotencyKey: redeemKeyRef.current,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        // Identisk indloesning behandles stadig. Behold noeglen, saa et nyt tryk
        // henter DET foerste resultat i stedet for at fejle.
        setNote({
          ok: false,
          text: data.message ?? "Belønningen behandles. Prøv igen om lidt.",
        });
        return;
      }
      // Vi fik et endeligt svar -> naeste indloesning er en NY handling.
      redeemKeyRef.current = newIdemKey();
      if (res.ok) {
        // Stor kvittering: markér tydeligt at beloenningen skal gives NU, og
        // kraev et bevidst "OK" for at lukke, saa den ikke overses. Serveren
        // giver de reelle rest-stempler (normalt 0, evt. kampagne-overskud).
        setPin("");
        haptic([30, 50, 30, 50, 120]);
        setRedeemed({
          rewardText: card.rewardText,
          stamps: data.stamps ?? 0,
          required: data.required ?? card.required,
        });
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke indløse." });
        setPin("");
      }
    } catch {
      // Intet svar (tabt/stallet): BEHOLD noeglen, saa et retry deduplikeres til
      // det foerste resultat (ingen falsk "kortet er ikke fuldt endnu").
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  // Personalet har givet beloenningen og trykker OK: luk fejringen og vis det
  // nulstillede kort (opdateret lokalt fra svaret, saa intet ekstra kald kan
  // fejle her). Kortet i sig selv er kvitteringen, saa ingen ekstra note.
  function confirmRedeemed() {
    if (redeemed && card) {
      setCard({
        ...card,
        stamps: redeemed.stamps,
        rewardReady: redeemed.stamps >= redeemed.required,
      });
    }
    setNote(null);
    setRedeemed(null);
  }

  async function undo() {
    if (!card || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetchWithTimeout("/api/staff/unstamp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serial: card.serial,
          idempotencyKey: undoKeyRef.current,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setNote({
          ok: false,
          text: data.message ?? "Fortryd behandles. Prøv igen om lidt.",
        });
        return;
      }
      // Endeligt svar -> naeste fortryd er en NY handling.
      undoKeyRef.current = newIdemKey();
      if (res.ok) {
        setCard({
          ...card,
          stamps: data.stamps,
          rewardReady: data.stamps >= data.required,
          lifetimeStamps: data.lifetimeStamps ?? card.lifetimeStamps,
        });
        setGiven(null);
        setNote({
          ok: true,
          text: `Fortrudt. Kortet står nu på ${data.stamps} af ${data.required}.`,
        });
      } else {
        setNote({ ok: false, text: data.message ?? "Kunne ikke fortryde." });
      }
    } catch {
      setNote({ ok: false, text: "Ingen forbindelse. Prøv igen." });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-5 rounded-lg border border-fog bg-white p-6 shadow-[0_20px_50px_-30px_rgba(26,26,26,0.4)]">
      {redeemed ? (
        <>
          <Celebration show />
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="relative flex h-20 w-20 items-center justify-center">
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-terracotta/20"
                style={{ animation: "burstRing 0.9s ease-out forwards" }}
              />
              <span
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-terracotta text-white"
                style={{
                  animation:
                    "giftOpen 0.72s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                <GiftGlyph className="h-9 w-9" />
              </span>
            </span>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
                Belønning indløst
              </span>
              <h2
                className="font-fraunces text-[1.8rem] font-light italic leading-tight text-ink"
                style={{
                  animation:
                    "countPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                }}
              >
                Giv belønningen nu
              </h2>
            </div>
            <p className="max-w-xs font-[300] text-[0.95rem] leading-relaxed text-stone">
              Giv{" "}
              <span className="font-[400] text-ink">{redeemed.rewardText}</span>{" "}
              til kunden.
            </p>
            <CtaGlow className="w-full max-w-xs">
              <button
                onClick={confirmRedeemed}
                className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} min-h-[3.6rem] text-[0.9rem]`}
              >
                OK, belønning givet
              </button>
            </CtaGlow>
          </div>
        </>
      ) : loading ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="h-10 w-10 animate-pulse rounded-full bg-terracotta/15" />
          <p className="font-[300] text-[0.9rem] text-stone">Henter kort...</p>
        </div>
      ) : card ? (
        <>
          <span data-kasse-kort hidden />
          {/* Hvem det er: personalet kan se, at det er det rigtige kort. */}
          {card.name ? (
            <p className="-mb-1 truncate text-center text-[1.2rem] font-[600] tracking-[-0.01em] text-ink">{card.name}</p>
          ) : null}
          {/* Uden stregkode: kortet er lige scannet, og pladsen skal bruges til
              knapperne, saa de kan ses uden at rulle. */}
          <div className="relative">
            <div
              key={`card-${pulse}`}
              style={
                pulse > 0
                  ? {
                      animation:
                        "cardBurst 0.6s cubic-bezier(0.34,1.56,0.64,1) both",
                    }
                  : undefined
              }
            >
              <StampCard
                businessName={card.businessName}
                logoUrl={logoSrc}
                primaryColor={card.primaryColor}
                textColor={card.textColor}
                stampIcon={card.stampIcon as StampIconKey}
                stamps={card.stamps}
                required={card.required}
                rewardText={card.rewardText}
              />
            </div>
            {pulse > 0 ? (
              <span
                key={`plus-${pulse}`}
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 select-none rounded-full bg-terracotta px-3 py-1 text-[0.8rem] font-[400] text-white shadow-lift"
                style={{ animation: "plusOne 1.15s ease-out forwards" }}
              >
                +{lastInc} {lastInc === 1 ? "stempel" : "stempler"}
              </span>
            ) : null}
          </div>

          {/* Diskret livstidstal: forstyrrer ikke stempel-flowet, men lader
              personalet se hvor loyal kunden er. */}
          {card.lifetimeStamps > 0 ? (
            <p className="text-center text-[0.78rem] font-[300] text-slate">
              <span className="font-[400] tabular-nums text-stone">
                {card.lifetimeStamps}
              </span>{" "}
              {card.lifetimeStamps === 1 ? "stempel" : "stempler"} i alt
            </p>
          ) : null}

          {/* Henvisning: vennens foerste besoeg og beloenninger, der er klar.
              Vises kun, naar der er noget at goere. */}
          {referrals ? <ReferralCheckIn serial={card.serial} hasPin={hasPin} /> : null}

          {note ? (
            <p
              role="status"
              aria-live="polite"
              className={cn(
                "text-center font-[300] text-[0.9rem]",
                note.ok ? "text-terracotta" : "text-rust",
              )}
            >
              {note.text}
            </p>
          ) : null}

          {card.rewardReady ? (
            <div className="flex flex-col gap-3 rounded-lg border border-terracotta bg-terracotta/5 p-5">
              {justFilled ? <Celebration show /> : null}
              <div>
                <p className={justFilled ? "text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-ink" : "font-[400] text-[1rem] text-ink"}>
                  {justFilled ? "Kortet er fuldt" : "Belønning klar"}
                </p>
                <p className="font-[300] text-[0.85rem] text-stone">
                  {card.rewardText}
                </p>
              </div>
              {hasPin ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-[0.66rem] font-[400] uppercase tracking-[0.12em] text-slate">
                    Personale-PIN for at indløse
                  </span>
                  <input
                    inputMode="numeric"
                    value={pin}
                    onChange={(e) =>
                      setPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="****"
                    autoFocus
                    aria-describedby="staff-pin-hint"
                    className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[300] tracking-[0.3em] text-ink outline-none focus:border-terracotta"
                  />
                  <span
                    id="staff-pin-hint"
                    className="text-[0.72rem] font-[300] text-slate"
                  >
                    Indtast 4 til 6 cifre.
                  </span>
                </label>
              ) : null}
              <button
                onClick={redeem}
                disabled={busy || (hasPin && pin.length < 4)}
                aria-busy={busy}
                className={btnClass("primary") + " self-start"}
              >
                {busy ? "Indløser..." : "Indløs belønning"}
              </button>
            </div>
          ) : given ? (
            // Kvittering: stemplet er givet. Faerdig er naeste skridt; fortryd er
            // tydeligt, hvis der blev trykket forkert.
            <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#E8F0FB] px-5 py-6 text-center" role="status" aria-live="polite">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#061C3D] text-white" style={{ animation: "celebrate-pop 420ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              <div>
                <p className="text-[1.4rem] font-bold leading-tight tracking-[-0.02em] text-ink">
                  {given.inc === 1 ? "Stempel givet" : `${given.inc} stempler givet`}
                </p>
                <p className="mt-1 text-[0.95rem] text-stone">
                  Kortet står på <span className="font-semibold tabular-nums text-ink">{given.stamps} af {given.required}</span>
                </p>
              </div>
              <button type="button" onClick={onExit} className={`${btnClass("primary", "lg")} w-full min-h-[3.4rem]`}>
                Færdig
              </button>
              <div className="flex w-full flex-wrap justify-center gap-2">
                <button type="button" onClick={() => setGiven(null)} className={`${btnClass("outline")} flex-1 whitespace-nowrap`}>
                  +1 stempel
                </button>
                <button type="button" onClick={undo} disabled={busy} aria-busy={busy} className={`${btnClass("outline")} flex-1 whitespace-nowrap !text-rust`}>
                  {busy ? "Fortryder..." : given.inc === 1 ? "Fortryd" : `Fortryd (fjern ${given.inc})`}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Antal: hurtig-vaelg med eet tryk (fx tre kaffe = 3) */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-[0.72rem] font-[400] uppercase tracking-[0.1em] text-slate">
                  Antal stempler
                </span>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setQty(n)}
                      disabled={busy}
                      aria-pressed={qty === n}
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-full text-[1rem] font-[400] tabular-nums transition-colors disabled:opacity-50",
                        qty === n
                          ? "bg-ink text-parchment"
                          : "border border-clay bg-white text-ink hover:border-terracotta",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <CtaGlow>
                <button
                  onClick={giveStamp}
                  disabled={busy}
                  aria-busy={busy}
                  className={`${btnClass("primary", "lg")} ${CTA_EMPHASIS} min-h-[3.6rem] text-[0.9rem]`}
                >
                  {busy ? (
                    "Et øjeblik..."
                  ) : (
                    <>
                      <StampIcon
                        icon={card.stampIcon as StampIconKey}
                        className="h-[1.1rem] w-[1.1rem]"
                      />
                      {qty === 1 ? "Giv stempel" : `Giv ${qty} stempler`}
                    </>
                  )}
                </button>
              </CtaGlow>
              {/* Foer stemplet: kun et diskret "luk", saa det ikke ligner, at man
                  skal trykke Faerdig for at give stemplet. */}
              <button type="button" onClick={onExit} className="mx-auto py-1 text-[0.82rem] text-slate underline underline-offset-2">
                Luk uden stempel
              </button>
            </div>
          )}

          {card.stamps > 0 && !given ? (
            <button
              type="button"
              onClick={undo}
              disabled={busy}
              className="mx-auto text-[0.75rem] font-[300] text-slate underline underline-offset-2 transition-colors hover:text-rust disabled:opacity-50"
            >
              Fortryd sidste stempel
            </button>
          ) : null}

          {/* Saa personalet ved besked, hvis kunden spoerger: Wallet-pass'et
              opdaterer sig selv efter et oejeblik (Apples baggrunds-push). */}
          {pulse > 0 ? (
            <p className="text-center text-[0.74rem] font-[300] text-slate">Wallet opdaterer om et øjeblik.</p>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <p className="font-[400] text-[1rem] text-ink">
            {loadError === "offline"
              ? "Ingen forbindelse"
              : "Kortet blev ikke fundet"}
          </p>
          {note ? (
            <p className="font-[300] text-[0.88rem] text-rust">{note.text}</p>
          ) : null}
          {loadError === "offline" ? (
            <button
              type="button"
              onClick={() => loadCard(serial)}
              className={btnClass("primary")}
            >
              Prøv igen
            </button>
          ) : null}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-fog pt-4">
        <button
          onClick={onRescan}
          className="text-[0.72rem] font-[400] uppercase tracking-[0.1em] text-terracotta transition-colors hover:text-terracotta-dark"
        >
          Scan nyt kort
        </button>
        {card && !card.rewardReady && !redeemed ? null : (
          <button
            onClick={onExit}
            className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-ink"
          >
            Færdig
          </button>
        )}
      </div>
    </div>
  );
}
