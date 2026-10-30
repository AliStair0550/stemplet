"use client";

import { useEffect, useMemo, useState } from "react";
import { rgba } from "@/lib/brand";
import { Confetti } from "@/components/Celebrate";

// "100 kr." slutter allerede med punktum: undgaa "100 kr.." i en saetning.
const end = (s: string) => (s.endsWith(".") ? s : `${s}.`);

// Henvis en ven: koden, del-knappen (telefonens delemenu) og kopiér link. Naar
// kunden har delt, fejrer vi det: konfetti i butikkens farver og et "Sendt!"-kort,
// der fortaeller, hvad der sker nu. Antal delinger huskes paa telefonen.
export function ShareReferral({
  code,
  text,
  url,
  friendGift,
  yourReward,
  referralsDone,
  fg,
  bg,
}: {
  code: string;
  text: string;
  url: string;
  friendGift: string;
  yourReward: string;
  referralsDone: number;
  fg: string;
  bg: string;
}) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState(0);
  // Taeller op ved hver fejring, saa konfettien starter forfra.
  const [party, setParty] = useState(0);
  const key = `kk-delt:${code}`;
  const colors = useMemo(() => [fg, rgba(fg, 0.7), "#F5C451", "#FFFFFF"], [fg]);

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    try {
      setShares(Number(localStorage.getItem(key) ?? 0) || 0);
    } catch {
      /* privat browsing: taelleren starter fra 0 */
    }
  }, [key]);

  function celebrate() {
    const n = shares + 1;
    setShares(n);
    setParty((p) => p + 1);
    try {
      localStorage.setItem(key, String(n));
    } catch {
      /* ikke kritisk */
    }
    navigator.vibrate?.(30);
  }

  async function share() {
    try {
      await navigator.share({ text, url });
      celebrate();
    } catch {
      /* annulleret: ingen fejring */
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
      celebrate();
    } catch {
      /* kopiering afvist: koden staar stadig paa skaermen */
    }
  }

  const btn = "inline-flex min-h-[3.25rem] flex-1 items-center justify-center rounded-full px-5 text-[1rem] font-semibold active:scale-[0.97] transition-transform";
  const muted = { color: rgba(fg, 0.72) };

  return (
    <div
      className="flex flex-col items-center gap-4 rounded-[26px] p-5 text-center"
      style={{ background: rgba(fg, 0.08), border: `1px solid ${rgba(fg, 0.14)}` }}
    >
      {party > 0 ? <Confetti key={party} colors={colors} count={70} originY="55%" /> : null}

      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.12em]" style={muted}>
        Henvis en ven
      </span>
      <p className="text-[1.45rem] font-bold leading-[1.1] tracking-[-0.03em]">
        Giv en ven {end(friendGift)} Få {yourReward} selv.
      </p>
      <p className="text-[0.92rem] leading-snug" style={muted}>
        Din ven får rabatten ved første besøg. Du får din belønning, når vennen har været her.
      </p>

      <div className="w-full rounded-2xl py-3.5" style={{ background: rgba(fg, 0.1), border: `1.5px dashed ${rgba(fg, 0.35)}` }}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em]" style={muted}>
          Din kode
        </p>
        <p className="text-[1.9rem] font-bold tracking-[0.1em]">{code}</p>
      </div>

      {party > 0 ? (
        <div
          role="status"
          className="w-full rounded-2xl p-4"
          style={{ background: fg, color: bg, animation: "cardReceive 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          <p className="text-[1.3rem] font-bold tracking-[-0.02em]">Sendt! Godt gået.</p>
          <p className="mt-1 text-[0.92rem] leading-snug" style={{ color: rgba(bg, 0.78) }}>
            Når din ven har været her, får du {end(yourReward)}{" "}
            {shares > 1 ? `Du har delt ${shares} gange.` : "Del gerne med flere."}
          </p>
        </div>
      ) : null}

      <div className="flex w-full gap-2">
        {canShare ? (
          <button type="button" onClick={share} className={btn} style={{ background: fg, color: bg }}>
            {party > 0 ? "Del med en til" : "Del"}
          </button>
        ) : null}
        <button
          type="button"
          onClick={copy}
          className={btn}
          style={canShare ? { border: `1px solid ${rgba(fg, 0.35)}`, color: fg } : { background: fg, color: bg }}
        >
          {copied ? "Kopieret" : "Kopiér link"}
        </button>
      </div>

      {referralsDone > 0 ? (
        <p className="text-[0.88rem] font-medium">
          Du har allerede henvist {referralsDone} {referralsDone === 1 ? "ven" : "venner"}. Tak.
        </p>
      ) : null}
    </div>
  );
}
