"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Selvkoerende "saadan virker det": tre roller som faner (Kunde, Medarbejder,
// Ejer), hver med trin der spiller automatisk, mens en telefon-mockup viser
// skaermen. Pauser ved hover, respekterer reduceret bevaegelse, stabler telefonen
// over trinene paa smalle skaerme. Passet er tegnet praecis som vores rigtige
// Apple Wallet-pass: butikkens farve, guld-stempler, gylden "naeste"-ring,
// stiplet gitter og gaveikon paa plads 10.

const GOLD = "#C9A24B";
const DASH = "rgba(255,255,255,0.30)";
const MUTED = "rgba(255,255,255,0.55)";
const DEMO_SERIAL = "K7M4QXP2R9";

type Role = "kunde" | "medarbejder" | "ejer";
type Step = { t: string; u: string; ms: number };

const LABEL: Record<Role, string> = {
  kunde: "Kunde",
  medarbejder: "Medarbejder",
  ejer: "Ejer",
};

const ROLES: Record<Role, Step[]> = {
  kunde: [
    { t: "Scan butikkens QR", u: "Med kameraet. Ingen app skal hentes.", ms: 850 },
    { t: "Tryk Hent mit stempelkort", u: "Ét tryk. Ingen app, ingen tilmelding.", ms: 2000 },
    { t: "Tilføj til Wallet", u: "Tryk Tilføj, så ligger kortet i din Wallet.", ms: 2200 },
    {
      t: "Vis kortet, se stemplerne vokse",
      u: "Det er alt. Kunden scanner ikke selv.",
      ms: 3600,
    },
  ],
  medarbejder: [
    { t: "Åbn stempelsiden", u: "Login-beskyttet. Virker på enhver telefon.", ms: 2000 },
    { t: "Scan kundens kort", u: "Scan QR-koden på kundens kort.", ms: 2600 },
    { t: "Vælg antal", u: "Fx 3 kaffe = 3 stempler.", ms: 2600 },
    { t: "Giv belønning ved fuldt kort", u: "Kortet nulstilles automatisk.", ms: 2800 },
  ],
  ejer: [
    { t: "Print QR til disken", u: "Færdige materialer følger med.", ms: 2100 },
    { t: "Del linket online", u: "Instagram, hjemmeside, nyhedsbrev.", ms: 2100 },
    { t: "Giv personalet adgang", u: "Stempelsiden er login-beskyttet.", ms: 2100 },
    { t: "Så kører alt af sig selv", u: "Ingen drift. Ingen vedligehold.", ms: 2600 },
  ],
};
const ORDER: Role[] = ["kunde", "medarbejder", "ejer"];

type PassProps = {
  businessName: string;
  reward: string;
  passColor: string;
  qrImage: string;
};

// ── Ikoner ───────────────────────────────────────────────────────────────
function GiftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z" />
      <path d="M3 8h18v3H3zM12 8v12M12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8" />
    </svg>
  );
}
function ScanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M3 12h18" />
    </svg>
  );
}
function PrintIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6z" />
    </svg>
  );
}
function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}
function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Wallet-pass (praecis som det rigtige) ──────────────────────────────────
function StampGrid({ filled, color }: { filled: number; color: string }) {
  const full = filled >= 10;
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 10 }).map((_, i) => {
        const isGift = i === 9;
        const isFilled = i < filled;
        const isNext = !isGift && i === filled;
        if (isGift) {
          return (
            <span
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full",
                full && "animate-demo-jubel",
              )}
              style={{
                border: `2px ${full ? "solid" : "dashed"} ${GOLD}`,
                background: full ? GOLD : "transparent",
                color: full ? color : GOLD,
              }}
            >
              <GiftIcon className="h-1/2 w-1/2" />
            </span>
          );
        }
        if (isFilled) {
          return (
            <span
              key={i}
              className="aspect-square rounded-full animate-stamp-pop"
              style={{ background: GOLD }}
            />
          );
        }
        if (isNext) {
          return (
            <span
              key={i}
              className="aspect-square rounded-full"
              style={{ border: `2.5px solid ${GOLD}` }}
            />
          );
        }
        return (
          <span
            key={i}
            className="aspect-square rounded-full"
            style={{ border: `2px dashed ${DASH}` }}
          />
        );
      })}
    </div>
  );
}

function Pass({
  filled,
  showQr,
  slideIn,
  pass,
}: {
  filled: number;
  showQr?: boolean;
  slideIn?: boolean;
  pass: PassProps;
}) {
  const shown = Math.min(filled, 10);
  return (
    <div
      className={cn("rounded-[18px] px-4 pb-4 pt-3.5", slideIn && "animate-demo-pass-in")}
      style={{ background: pass.passColor }}
    >
      <div className="flex items-start justify-between">
        <span
          className="text-[12px] font-[600] uppercase tracking-[0.04em]"
          style={{ color: MUTED }}
        >
          {pass.businessName}
        </span>
        <span className="text-right leading-none">
          <span className="mb-1 block text-[7.5px] font-[700] tracking-[0.16em]" style={{ color: MUTED }}>
            STEMPLER
          </span>
          <span className="text-[15px] font-[600] text-white">{shown}/10</span>
        </span>
      </div>

      <div className="mt-4">
        <StampGrid filled={filled} color={pass.passColor} />
      </div>

      <div className="mt-4 flex items-end justify-between text-[11px] text-white/85">
        <span>{pass.reward}</span>
        <span>{10 - shown} tilbage</span>
      </div>

      {showQr ? (
        <div className="mt-4 flex flex-col items-center">
          <div className="rounded-lg bg-white p-1.5">
            <div
              className="h-[60px] w-[60px] bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${pass.qrImage})` }}
            />
          </div>
          <span className="mt-1 font-mono text-[8px] tracking-[0.12em] text-white/55">
            {DEMO_SERIAL}
          </span>
        </div>
      ) : null}
    </div>
  );
}

// ── Telefon-skaerme ────────────────────────────────────────────────────────
function StaffHead({ status }: { status: string }) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-fog pb-2.5 text-[11px] font-[700] text-ink">
      <span>Stemplet · Personale</span>
      <span className="text-[10px] font-[600] text-moss">{status}</span>
    </div>
  );
}

// Kamera der scanner en QR. Genbrugt: kunden scanner butikkens QR, personalet
// scanner QR-koden paa kundens kort. Samme udtryk begge steder.
function CameraScan({ qrImage }: { qrImage: string }) {
  return (
    <div
      className="relative flex h-[150px] w-[150px] items-center justify-center rounded-2xl"
      style={{ boxShadow: `inset 0 0 0 2px ${GOLD}55` }}
    >
      <div
        className="h-[104px] w-[104px] rounded bg-white bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${qrImage})` }}
      />
      <span
        className="absolute left-3 right-3 top-4 h-0.5 animate-demo-scan"
        style={{ background: GOLD, boxShadow: `0 0 10px ${GOLD}` }}
      />
    </div>
  );
}

const SCREEN = "flex h-full flex-col px-4 pb-4 pt-14";

function Screen({
  role,
  step,
  grow,
  pass,
}: {
  role: Role;
  step: number;
  grow: number;
  pass: PassProps;
}) {
  if (role === "kunde") {
    // 0: scan butikkens QR
    if (step === 0) {
      return (
        <div className={cn(SCREEN, "items-center justify-center bg-[#0E0F12]")}>
          <CameraScan qrImage={pass.qrImage} />
          <p className="mt-4 text-center text-[11px] text-white/55">
            Peg kameraet på butikkens QR
          </p>
        </div>
      );
    }
    // 1: tilmeldings-side (/k)
    if (step === 1) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <div className="m-auto w-full text-center">
            <div className="text-[13px] font-[400] leading-tight text-ink">
              Dit stempelkort hos {pass.businessName}
            </div>
            <p className="mx-auto mt-1 max-w-[85%] text-[9.5px] leading-snug text-stone">
              {pass.reward}. Ingen app. Ingen tilmelding.
            </p>
            <div className="mt-3">
              <Pass filled={0} pass={pass} />
            </div>
            <span className="mt-3 inline-block w-full rounded-[10px] bg-ink px-4 py-2.5 text-[11px] font-[500] uppercase tracking-[0.08em] text-parchment animate-demo-press">
              Hent mit stempelkort
            </span>
          </div>
        </div>
      );
    }
    // 2: tilfoej til Apple Wallet (iOS-skaerm)
    if (step === 2) {
      return (
        <div className="flex h-full flex-col bg-black px-3 pb-4 pt-12">
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-[11px] text-white">
              ✕
            </span>
            <span className="text-[10.5px] font-[600] text-white">
              Stempelkort - {pass.businessName}
            </span>
            <span className="rounded-full bg-[#0A84FF] px-3 py-1 text-[11px] font-[600] text-white animate-demo-press">
              Tilføj
            </span>
          </div>
          <div className="my-auto">
            <Pass filled={0} showQr pass={pass} />
          </div>
        </div>
      );
    }
    // 3: kortet i Wallet, stempler vokser
    return (
      <div className={cn(SCREEN, "justify-end bg-black px-3")}>
        <Pass filled={grow} showQr slideIn pass={pass} />
      </div>
    );
  }

  if (role === "medarbejder") {
    // 0: aabn stempelsiden
    if (step === 0) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <StaffHead status="Logget ind" />
          <div className="m-auto text-center">
            <div className="mx-auto mb-3 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-ink animate-demo-press">
              <ScanIcon className="h-10 w-10 text-parchment" />
            </div>
            <p className="text-[13px] font-[600] text-ink">Åbn stempelsiden</p>
          </div>
        </div>
      );
    }
    // 1: scan kundens kort (QR + scanline) -> stempel givet
    if (step === 1) {
      return (
        <div className={cn(SCREEN, "items-center bg-[#0E0F12]")}>
          <div className="text-[10px] font-[600] uppercase tracking-[0.12em] text-white/50">
            Scan kundens kort
          </div>
          <div className="flex flex-1 items-center">
            <CameraScan qrImage={pass.qrImage} />
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-moss px-3 py-1.5 text-[11px] font-[600] text-parchment animate-demo-screen"
            style={{ animationDelay: "0.7s" }}
          >
            <CheckIcon className="h-3 w-3" /> 1 stempel givet
          </span>
        </div>
      );
    }
    // 2: vaelg antal (1-5, 3 valgt)
    if (step === 2) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <StaffHead status="Vælg antal" />
          <div className="my-auto">
            <Pass filled={4} pass={pass} />
            <div className="mt-3 flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-[9px] border text-[13px]",
                    n === 3
                      ? "border-ink bg-ink text-parchment animate-stamp-pop"
                      : "border-clay bg-white text-slate",
                  )}
                >
                  {n}
                </span>
              ))}
            </div>
            <p className="mt-2.5 text-center text-[12px] font-[700] text-moss">
              3 kaffe = 3 stempler
            </p>
          </div>
        </div>
      );
    }
    // 3: fuldt kort -> beloenning
    return (
      <div className={cn(SCREEN, "bg-parchment")}>
        <StaffHead status="Fuldt kort" />
        <div className="my-auto">
          <Pass filled={10} pass={pass} />
          <p className="mt-3 text-center text-[12px] font-[700] text-moss">
            Belønning givet. Kortet nulstilles
          </p>
        </div>
      </div>
    );
  }

  // ── ejer (flottere: kort der lyser op med flueben, gylden afslutning) ──
  const level = step;
  const points = [
    { icon: <PrintIcon className="h-[18px] w-[18px]" />, t: "Print QR til disken" },
    { icon: <ShareIcon className="h-[18px] w-[18px]" />, t: "Del linket online" },
    { icon: <LockIcon className="h-[18px] w-[18px]" />, t: "Giv personalet adgang" },
  ];
  return (
    <div className={cn(SCREEN, "justify-center gap-3.5 bg-gradient-to-b from-parchment to-sand")}>
      {points.map((p, i) => {
        const lit = i <= level;
        return (
          <div
            key={i}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-500",
              lit
                ? "border-moss/25 bg-white shadow-[0_10px_22px_-14px_rgba(45,95,74,0.55)]"
                : "scale-[0.97] border-fog/70 bg-white/45",
            )}
          >
            <span
              className={cn(
                "flex h-9 w-9 flex-none items-center justify-center rounded-xl transition-colors duration-500",
                lit ? "bg-moss text-parchment" : "bg-fog text-slate",
              )}
            >
              {p.icon}
            </span>
            <span
              className={cn(
                "text-[12.5px] font-[600] transition-colors duration-500",
                lit ? "text-ink" : "text-slate",
              )}
            >
              {p.t}
            </span>
            <span
              className={cn(
                "ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-moss text-parchment transition-all duration-300",
                lit ? "scale-100 opacity-100" : "scale-0 opacity-0",
              )}
            >
              <CheckIcon className="h-3 w-3" />
            </span>
          </div>
        );
      })}
      <div
        className={cn(
          "mt-1 flex items-center justify-center gap-2 rounded-2xl border p-3.5 text-[13px] font-[800] text-ink transition-all duration-500",
          level >= 3 ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
        style={{ background: `${GOLD}22`, borderColor: `${GOLD}80` }}
      >
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full"
          style={{ background: GOLD, color: pass.passColor }}
        >
          <CheckIcon className="h-3 w-3" />
        </span>
        Så kører alt af sig selv
      </div>
    </div>
  );
}

// ── Hovedkomponent ─────────────────────────────────────────────────────────
export function HowItWorksDemo(pass: PassProps) {
  const [role, setRole] = useState<Role>("kunde");
  const [step, setStep] = useState(0);
  const [grow, setGrow] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const reduced = useRef(false);

  // Reduceret bevaegelse: spil ikke automatisk (brugeren styrer selv).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reduced.current = true;
      setPlaying(false);
    }
  }, []);

  // Auto-fremdrift: naeste trin, og naar en rolle er faerdig, tager naeste over.
  useEffect(() => {
    if (!playing || hovered) return;
    const ms = ROLES[role][step].ms;
    const id = window.setTimeout(() => {
      if (step + 1 < ROLES[role].length) {
        setStep(step + 1);
      } else {
        setRole(ORDER[(ORDER.indexOf(role) + 1) % ORDER.length]);
        setStep(0);
      }
    }, ms);
    return () => clearTimeout(id);
  }, [role, step, playing, hovered]);

  // Kundens stempler vokser 0 -> 3 paa det sidste kunde-trin (kortet i Wallet).
  useEffect(() => {
    if (role !== "kunde" || step !== ROLES.kunde.length - 1) return;
    if (reduced.current) {
      setGrow(3);
      return;
    }
    setGrow(0);
    const ids = [1, 2, 3].map((n, i) =>
      window.setTimeout(() => setGrow(n), 950 + i * 620),
    );
    return () => ids.forEach(clearTimeout);
  }, [role, step]);

  const viewKey = role === "ejer" ? "ejer" : `${role}-${step}`;

  return (
    <div
      className="w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Faner med progress */}
      <div className="grid grid-cols-3 gap-2.5" role="tablist" aria-label="Roller">
        {ORDER.map((r) => {
          const active = r === role;
          const done = ORDER.indexOf(r) < ORDER.indexOf(role);
          const pct = active ? ((step + 1) / ROLES[r].length) * 100 : done ? 100 : 0;
          return (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setRole(r);
                setStep(0);
              }}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50",
                active ? "border-ink bg-white" : "border-fog hover:border-clay",
              )}
            >
              <span
                className={cn(
                  "mb-2 block text-[11px] font-[700] uppercase tracking-[0.06em] sm:text-[12px]",
                  active ? "text-ink" : "text-slate",
                )}
              >
                {LABEL[r]}
              </span>
              <span className="block h-[3px] overflow-hidden rounded-full bg-fog">
                <span
                  className="block h-full rounded-full bg-moss transition-[width] duration-500 ease-linear"
                  style={{ width: `${pct}%` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      {/* Scene: trin + telefon. Paa smalle skaerme staar telefonen over trinene. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-7">
        <ol className="order-2 flex flex-col gap-1 lg:order-1">
          {ROLES[role].map((s, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setStep(i)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl p-3 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50",
                    active
                      ? "bg-white opacity-100 shadow-[0_1px_0_rgba(26,26,26,0.06)]"
                      : done
                        ? "opacity-70"
                        : "opacity-45",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 h-[22px] w-[22px] flex-none rounded-full border-2 transition-colors",
                      active
                        ? "border-solid border-moss"
                        : done
                          ? "border-solid border-moss bg-moss"
                          : "border-dashed border-slate",
                    )}
                  />
                  <span className="min-w-0">
                    <b className="block text-[15px] font-[700] leading-tight text-ink">
                      {s.t}
                    </b>
                    <span className="mt-1 block text-[13px] leading-snug text-stone">
                      {s.u}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="order-1 flex justify-center lg:order-2">
          <div className="relative h-[468px] w-[230px] overflow-hidden rounded-[38px] border-[6px] border-[#2E2E32] bg-[#101012] shadow-[0_24px_48px_-22px_rgba(26,26,26,0.4)]">
            <span className="absolute left-1/2 top-3 z-30 h-[19px] w-[68px] -translate-x-1/2 rounded-full bg-black" />
            <div key={viewKey} className="absolute inset-0 animate-demo-screen">
              <Screen role={role} step={step} grow={grow} pass={pass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
