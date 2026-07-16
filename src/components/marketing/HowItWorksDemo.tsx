"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Selvkoerende "saadan virker det": tre roller som faner (Kunde, Medarbejder,
// Ejer), hver med trin der spiller automatisk, mens en telefon-mockup viser hvad
// der sker paa skaermen. Pauser ved hover, respekterer reduceret bevaegelse, og
// stabler telefonen over trinene paa smalle skaerme.

// Passet holdes i "rigtig Wallet"-udtryk: moerkeblaat med guld-stempler, stiplet
// gitter og gaveikon paa plads 10. Resten er sitets brand (blaek + moss).
const NAVY = "#0D1F3C";
const GOLD = "#C9A24B";
const ON_NAVY_MUTED = "#8FA0BC";

type Role = "kunde" | "medarbejder" | "ejer";
type Step = { t: string; u: string; e?: number; ms: number };

const LABEL: Record<Role, string> = {
  kunde: "Kunde",
  medarbejder: "Medarbejder",
  ejer: "Ejer",
};

const ROLES: Record<Role, Step[]> = {
  kunde: [
    { t: "Scan butikkens QR", u: "Med kameraet. Ingen app skal hentes.", ms: 1300 },
    { t: "Tryk Hent mit stempelkort", u: "Kortet lægger sig i Apple Wallet.", ms: 2200 },
    {
      t: "Vis kortet, se stemplerne vokse",
      u: "Det er alt. Kunden scanner ikke selv.",
      ms: 3600,
    },
  ],
  medarbejder: [
    { t: "Åbn stempelsiden", u: "Login-beskyttet. Virker på enhver telefon.", ms: 2000 },
    { t: "Scan kundens kort", u: "Ét stempel gives med det samme.", ms: 2400 },
    { t: "Vælg antal", u: "Fx 3 kaffe = 3 stempler.", ms: 2600 },
    { t: "Giv belønning ved fuldt kort", u: "Kortet nulstilles automatisk.", ms: 2800 },
  ],
  ejer: [
    { t: "Print QR til disken", u: "Færdige materialer følger med.", e: 0, ms: 2100 },
    { t: "Del linket online", u: "Instagram, hjemmeside, nyhedsbrev.", e: 1, ms: 2100 },
    { t: "Giv personalet adgang", u: "Stempelsiden er login-beskyttet.", e: 2, ms: 2100 },
    { t: "Så kører alt af sig selv", u: "Ingen drift. Ingen vedligehold.", e: 3, ms: 2600 },
  ],
};
const ORDER: Role[] = ["kunde", "medarbejder", "ejer"];

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

// ── Wallet-pass (moerkeblaat, guld-stempler, gaveikon paa plads 10) ────────
function StampGrid({ filled, pop }: { filled: number; pop?: boolean }) {
  const full = filled >= 10;
  return (
    <div className="grid grid-cols-5 gap-[7px]">
      {Array.from({ length: 10 }).map((_, i) => {
        const isGift = i === 9;
        const isFilled = i < filled;
        if (isGift) {
          return (
            <span
              key={i}
              className={cn(
                "flex aspect-square items-center justify-center rounded-full border-2",
                full ? "border-solid animate-demo-jubel" : "border-dashed",
              )}
              style={{
                borderColor: GOLD,
                background: full ? GOLD : "transparent",
                color: full ? NAVY : GOLD,
              }}
            >
              <GiftIcon className="h-3 w-3" />
            </span>
          );
        }
        return (
          <span
            key={i}
            className={cn(
              "aspect-square rounded-full border-2",
              isFilled ? "border-solid" : "border-dashed",
              isFilled && pop && "animate-stamp-pop",
            )}
            style={{
              borderColor: isFilled ? GOLD : "rgba(143,160,188,0.65)",
              background: isFilled ? GOLD : "transparent",
            }}
          />
        );
      })}
    </div>
  );
}

function Pass({
  filled,
  showQr,
  pop,
  slideIn,
}: {
  filled: number;
  showQr?: boolean;
  pop?: boolean;
  slideIn?: boolean;
}) {
  const shown = Math.min(filled, 10);
  return (
    <div
      className={cn("rounded-2xl px-4 pb-4 pt-3.5", slideIn && "animate-demo-pass-in")}
      style={{ background: NAVY }}
    >
      <div className="mb-3 flex items-baseline justify-between">
        <span className="text-[11px] font-[600] tracking-[0.05em]" style={{ color: ON_NAVY_MUTED }}>
          KAFFEBAREN
        </span>
        <span className="text-right text-[13px] font-[600] leading-none text-white">
          <span className="mb-0.5 block text-[7px] font-[700] tracking-[0.14em]" style={{ color: ON_NAVY_MUTED }}>
            STEMPLER
          </span>
          {shown}/10
        </span>
      </div>
      <StampGrid filled={filled} pop={pop} />
      <div className="mt-3 flex justify-between text-[10px]" style={{ color: "#DCE4F0" }}>
        <span>10. kop er gratis</span>
        <span>{10 - shown} tilbage</span>
      </div>
      {showQr ? (
        <div
          className="mx-auto mt-3 h-[58px] w-[58px] rounded-md bg-white"
          style={{
            backgroundImage:
              "conic-gradient(#0B0B0C 0 25%, #fff 0 50%, #0B0B0C 0 75%, #fff 0)",
            backgroundSize: "14px 14px",
            backgroundPosition: "center",
            backgroundClip: "content-box",
            padding: "5px",
          }}
        />
      ) : null}
    </div>
  );
}

// ── Telefon-skaerme pr. rolle/trin ─────────────────────────────────────────
function FakeQr({ size }: { size: number }) {
  const f = Math.round(size * 0.24);
  const corner = (extra: string) => (
    <span
      className={cn("absolute rounded-[3px] border-[4px] border-[#0B0B0C] bg-white", extra)}
      style={{ width: f, height: f }}
    />
  );
  return (
    <div
      className="relative rounded-md"
      style={{
        width: size,
        height: size,
        background: "#fff",
        backgroundImage:
          "conic-gradient(#0B0B0C 0 25%, #fff 0 50%, #0B0B0C 0 75%, #fff 0)",
        backgroundSize: `${Math.round(size / 4.5)}px ${Math.round(size / 4.5)}px`,
      }}
    >
      {corner("left-1.5 top-1.5")}
      {corner("right-1.5 top-1.5")}
      {corner("bottom-1.5 left-1.5")}
    </div>
  );
}

function StaffHead({ status }: { status: string }) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-fog pb-2.5 text-[11px] font-[700] text-ink">
      <span>Stemplet · Personale</span>
      <span className="text-[10px] font-[600] text-moss">{status}</span>
    </div>
  );
}

const SCREEN = "flex h-full flex-col px-4 pb-4 pt-14";

function Screen({ role, step, grow }: { role: Role; step: number; grow: number }) {
  if (role === "kunde") {
    if (step === 0) {
      return (
        <div className={cn(SCREEN, "bg-[#1B1D22]")}>
          <div
            className="relative m-auto flex h-[148px] w-[148px] items-center justify-center rounded-2xl border-2"
            style={{ borderColor: `${GOLD}55` }}
          >
            <FakeQr size={104} />
            <span
              className="absolute left-3 right-3 top-3 h-0.5 animate-demo-scan"
              style={{ background: GOLD, boxShadow: `0 0 12px ${GOLD}` }}
            />
          </div>
          <p className="pb-1 text-center text-[11px]" style={{ color: "#9BA3B0" }}>
            Peg kameraet på butikkens QR
          </p>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <div className="m-auto w-full rounded-2xl bg-white p-5 text-center shadow-[0_2px_10px_rgba(26,26,26,0.08)]">
            <div className="text-[15px] font-[700] text-ink">Kaffebaren</div>
            <p className="mt-1 text-[12px] leading-snug text-stone">
              10 stempler. 10. kop er gratis.
            </p>
            <span className="mt-4 inline-block rounded-[10px] bg-ink px-4 py-3 text-[13px] font-[600] text-parchment animate-demo-press">
              Hent mit stempelkort
            </span>
          </div>
        </div>
      );
    }
    return (
      <div className={cn(SCREEN, "justify-end bg-black px-3")}>
        <Pass filled={grow} showQr slideIn pop />
      </div>
    );
  }

  if (role === "medarbejder") {
    if (step === 0) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <StaffHead status="Logget ind" />
          <div className="m-auto text-center">
            <div className="mx-auto mb-3 flex h-[100px] w-[100px] items-center justify-center rounded-full bg-ink animate-demo-press">
              <ScanIcon className="h-10 w-10 text-parchment" />
            </div>
            <p className="text-[13px] font-[600] text-ink">Scan kundens kort</p>
          </div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <StaffHead status="Kort fundet" />
          <div className="my-auto">
            <Pass filled={1} pop />
            <p className="mt-3 text-center text-[12px] font-[700] text-moss">
              1 stempel givet
            </p>
          </div>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className={cn(SCREEN, "bg-parchment")}>
          <StaffHead status="Vælg antal" />
          <div className="my-auto">
            <Pass filled={4} />
            <div className="mt-3 flex justify-center gap-2">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-[10px] border text-[14px]",
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
    return (
      <div className={cn(SCREEN, "bg-parchment")}>
        <StaffHead status="Fuldt kort" />
        <div className="my-auto">
          <Pass filled={10} />
          <p className="mt-3 text-center text-[12px] font-[700] text-moss">
            Belønning givet. Kortet nulstilles
          </p>
        </div>
      </div>
    );
  }

  // ejer
  const level = ROLES.ejer[step].e ?? -1;
  const points = [
    { icon: <PrintIcon className="h-4 w-4 text-parchment" />, t: "Print QR til disken" },
    { icon: <ShareIcon className="h-4 w-4 text-parchment" />, t: "Del linket online" },
    { icon: <LockIcon className="h-4 w-4 text-parchment" />, t: "Giv personalet adgang" },
  ];
  return (
    <div className={cn(SCREEN, "gap-2.5 bg-parchment")}>
      {points.map((p, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-3 rounded-xl bg-white p-3 text-[12px] font-[600] text-ink shadow-[0_1px_4px_rgba(26,26,26,0.06)] transition-all duration-300",
            i <= level ? "translate-x-0 opacity-100" : "translate-x-2 opacity-30",
          )}
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-[9px] bg-ink">
            {p.icon}
          </span>
          {p.t}
        </div>
      ))}
      <div
        className={cn(
          "mt-auto rounded-xl border p-3 text-center text-[13px] font-[800] text-ink transition-opacity duration-500",
          level >= 3 ? "opacity-100" : "opacity-0",
        )}
        style={{ background: `${GOLD}26`, borderColor: `${GOLD}80` }}
      >
        Så kører alt af sig selv
      </div>
    </div>
  );
}

// ── Hovedkomponent ─────────────────────────────────────────────────────────
export function HowItWorksDemo() {
  const [role, setRole] = useState<Role>("kunde");
  const [step, setStep] = useState(0);
  const [grow, setGrow] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const reduced = useRef(false);

  // Reduceret bevaegelse: spil ikke automatisk (brugeren styrer selv via faner).
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

  // Kundens stempler vokser 0 -> 3, mens Wallet-kortet vises.
  useEffect(() => {
    if (role !== "kunde" || step !== 2) return;
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
              <Screen role={role} step={step} grow={grow} />
            </div>
          </div>
        </div>
      </div>

      {/* Diskret afspil/pause */}
      <div className="mt-5 flex items-center gap-3 lg:justify-center">
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          className="rounded-lg border border-fog bg-white px-3.5 py-1.5 text-[0.72rem] font-[500] uppercase tracking-[0.08em] text-ink transition-colors hover:border-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/50"
        >
          {playing ? "Pause" : "Afspil"}
        </button>
        <span className="text-[0.72rem] font-[300] text-slate">
          {playing ? "Afspiller automatisk" : "På pause"}
        </span>
      </div>
    </div>
  );
}
