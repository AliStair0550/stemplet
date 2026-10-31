"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { NEWS_MAX, sameAsCurrent } from "@/lib/news";
import { formatDkDate } from "@/lib/utils";
import { Confetti, CheckBurst } from "@/components/Celebrate";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { clearNewsAction, sendNewsAction } from "./actions";

const IDEAS = [
  "Dobbelt stempel hele weekenden. Vi glæder os til at se dig.",
  "Nye åbningstider fra mandag: 7 til 17.",
  "Nyhed: prøv vores nye sæsonmenu. Kun i en kort periode.",
];

type Sent = { id: string; text: string; recipients: number; sentAt: string };

const time = (iso: string) =>
  new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Copenhagen" }).format(d);
/** "i dag kl. 14.05", "i morgen kl. 02.02", ellers datoen. */
const when = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const day =
    dayKey(d) === dayKey(now)
      ? "i dag"
      : dayKey(d) === dayKey(new Date(now.getTime() + 864e5))
        ? "i morgen"
        : dayKey(d) === dayKey(new Date(now.getTime() - 864e5))
          ? "i går"
          : formatDkDate(d);
  return `${day} kl. ${time(iso)}`;
};
const kort = (n: number) => `${n} kort`;

/** Saadan ser beskeden ud paa kundens laaseskaerm. */
function LockScreen({ shopName, text, landed = false }: { shopName: string; text: string; landed?: boolean }) {
  const day = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return (
    <div>
      <div className="rounded-[28px] bg-gradient-to-b from-[#0A2D5A] to-[#020B1C] p-5 pb-8 text-white">
        <p className="text-center text-[2.4rem] font-semibold leading-none tracking-[-0.03em]">9.41</p>
        <p className="mt-1 text-center text-[0.8rem] text-white/70">{day.charAt(0).toUpperCase() + day.slice(1)}</p>
        <div
          className="mt-6 rounded-[18px] bg-white/85 p-3 text-[#0B1628] backdrop-blur-xl"
          style={landed ? { animation: "news-drop 650ms cubic-bezier(0.16, 1, 0.3, 1) 250ms both" } : undefined}
        >
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[#061C3D] text-[0.6rem] font-bold text-white">
              {shopName.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate text-[0.8rem] font-semibold">{shopName}</span>
            <span className="ml-auto text-[0.72rem] text-[#5F6B7E]">nu</span>
          </div>
          <p className="mt-1.5 break-words text-[0.85rem] leading-snug">{text || "Din besked vises her."}</p>
        </div>
      </div>
      <p className="mt-2.5 text-center text-[0.78rem] text-slate">Sådan ser kunderne det</p>
    </div>
  );
}

export function NewsComposer({
  shopName,
  initialText = "",
  current,
  sentAt,
  nextAllowedAt,
  inWallet,
  optedOut,
  history,
}: {
  shopName: string;
  initialText?: string;
  current: string | null;
  sentAt: string | null;
  nextAllowedAt: string | null;
  inWallet: number;
  optedOut: number;
  history: Sent[];
}) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<number | null>(null);
  const [sentText, setSentText] = useState("");
  const celebrateRef = useRef<HTMLElement>(null);

  // Paa telefonen kan fejringen ligge uden for skaermen efter et tryk laengere nede.
  useEffect(() => {
    if (sentTo !== null) celebrateRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [sentTo]);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const locked = Boolean(nextAllowedAt);
  const trimmed = text.trim();
  const duplicate = sameAsCurrent(trimmed, current);
  const canSend = !locked && !pending && trimmed.length > 0 && !duplicate && inWallet > 0;

  function edit(v: string) {
    setText(v.slice(0, NEWS_MAX));
    setSentTo(null);
    setConfirming(false);
    setError(null);
  }

  function send() {
    setError(null);
    start(async () => {
      const res = await sendNewsAction(text);
      setConfirming(false);
      if (res.ok) {
        setSentTo(res.recipients);
        setSentText(trimmed);
        setText("");
      } else setError(res.error);
    });
  }

  function clear() {
    setError(null);
    start(async () => {
      const res = await clearNewsAction();
      if (!res.ok) setError(res.error);
    });
  }

  const reach =
    inWallet > 0 ? `Når ${inWallet} ${inWallet === 1 ? "kunde" : "kunder"} med kortet i Wallet.` : "Når kunder med kortet i Wallet.";

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
      <div className="flex min-w-0 flex-col gap-5">
        {sentTo !== null ? (
          // Fejringen: beskeden er ude. Konfetti, flueben, tallet der taeller op,
          // og beskeden, der lander paa laaseskaermen.
          <section ref={celebrateRef} role="status" className="relative scroll-mt-24 overflow-hidden rounded-[22px] bg-[#061C3D] p-6 text-white md:p-7">
            <Confetti colors={["#FFFFFF", "#7CC4FF", "#1B5EAE", "#C8D8E8"]} originY="30%" />
            <CheckBurst size={52} bg="#7CC4FF" fg="#061C3D" />
            <p className="mt-4 text-[1.6rem] font-bold leading-tight tracking-[-0.03em]">
              Sendt til <AnimatedNumber value={sentTo} /> {sentTo === 1 ? "kunde" : "kunder"}
            </p>
            <p className="mt-1 text-[0.92rem] text-white/75">Den lander på deres låseskærm i løbet af få minutter.</p>
            <div className="mx-auto mt-6 max-w-[320px] lg:hidden">
              <LockScreen shopName={shopName} text={sentText} landed />
            </div>
            {nextAllowedAt ? <p className="mt-5 text-[0.82rem] text-white/60">Næste pushbesked kan sendes {when(nextAllowedAt)}.</p> : null}
          </section>
        ) : locked ? (
          <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
            <h2 className="flex items-center gap-2.5 text-[1.05rem] font-semibold text-ink">
              <CheckBurst size={26} bg="#1B5EAE" fg="#FFFFFF" />
              Dagens pushbesked er sendt
            </h2>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-stone">
              Du kan sende den næste {nextAllowedAt ? when(nextAllowedAt) : "i morgen"}. Én om dagen, så kunderne bliver glade, når den kommer.
            </p>
            {initialText ? (
              <p className="mt-3 rounded-xl bg-[#F2F5F9] px-4 py-3 text-[0.86rem] leading-relaxed text-ink">
                Tilbuddet er gemt, og kunderne kan se det under kortet. Vil du sende det som pushbesked, så tryk på &quot;Send som pushbesked&quot; under Tilbud igen {nextAllowedAt ? when(nextAllowedAt) : "i morgen"}.
              </p>
            ) : null}
          </section>
        ) : (
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
          <label htmlFor="news" className="text-[1.05rem] font-semibold text-ink">
            Ny pushbesked
          </label>
          <p className="mt-0.5 text-[0.85rem] text-stone">{reach}</p>
          <textarea
            id="news"
            value={text}
            onChange={(e) => edit(e.target.value)}
            maxLength={NEWS_MAX}
            rows={3}
            disabled={pending}
            className="mt-3 w-full resize-none rounded-xl border border-fog px-4 py-3 text-[0.98rem] leading-relaxed text-ink outline-none disabled:opacity-60"
          />
          <div className="mt-1.5 flex items-center justify-between gap-3 text-[0.78rem] text-slate">
            <span>Kort og konkret virker bedst. Fortæl, hvad der sker, og hvornår.</span>
            <span className="shrink-0 tabular-nums">
              {text.length}/{NEWS_MAX}
            </span>
          </div>

          {!locked && !trimmed ? (
            <div className="mt-4">
              <p className="text-[0.78rem] font-medium text-stone">Idéer</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {IDEAS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => edit(i)}
                    className="rounded-full border border-clay px-3 py-1.5 text-left text-[0.8rem] text-stone hover:border-ink hover:text-ink"
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Forhaandsvisning direkte under feltet paa mobil (i siden paa store skaerme). */}
          {trimmed ? (
            <div className="mt-5 lg:hidden">
              <LockScreen shopName={shopName} text={trimmed} />
            </div>
          ) : null}

          {duplicate ? (
            <p className="mt-4 text-[0.88rem] text-rust">
              Det er den samme besked, som står på kortene nu. Skriv en ny, så kunderne får besked.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="mt-4 text-[0.88rem] text-rust">
              {error}
            </p>
          ) : null}
          {inWallet === 0 ? (
            <div className="mt-5 rounded-xl bg-sand px-4 py-3 text-[0.88rem] leading-relaxed text-ink">
              Ingen kunder har kortet i Apple Wallet endnu. Pushbeskeder når kun kort i Wallet.{" "}
              <Link href="/app/plakat" className="font-semibold underline underline-offset-4">
                Hæng plakaten op
              </Link>
              , så kunderne henter kortet.
            </div>
          ) : confirming ? (
            <div className="mt-5 rounded-xl border border-fog bg-sand p-4">
              <p className="text-[0.92rem] font-semibold text-ink">Send til {kort(inWallet)} nu?</p>
              <p className="mt-1 text-[0.84rem] leading-relaxed text-stone">
                Beskeden vises med det samme på kundernes låseskærm og kan ikke kaldes tilbage. Du kan fjerne den fra kortene bagefter.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={send}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-white hover:bg-[#0A2D5A] disabled:opacity-50"
                >
                  {pending ? "Sender..." : "Ja, send"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={pending}
                  className="inline-flex min-h-11 items-center rounded-full border border-clay px-5 text-[0.92rem] text-ink hover:border-ink disabled:opacity-50"
                >
                  Fortryd
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={!canSend}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-ink px-6 text-[0.95rem] font-semibold text-white hover:bg-[#0A2D5A] disabled:opacity-50 sm:w-auto"
              >
                Send pushbesked
              </button>
            </div>
          )}
        </section>
        )}

        {current ? (
          <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[1.05rem] font-semibold text-ink">På kortene nu</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">{current}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.82rem] text-stone">
              {sentAt ? <span>Sendt {when(sentAt)}</span> : null}
              <button type="button" onClick={clear} disabled={pending} className="underline underline-offset-4 hover:text-ink disabled:opacity-50">
                Fjern fra kortene
              </button>
            </div>
            <p className="mt-2 text-[0.78rem] text-slate">Står på bagsiden af kortet, til du sender en ny eller fjerner den. At fjerne den giver ingen notifikation.</p>
          </section>
        ) : null}

        {history.length > 0 ? (
          <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-[1.05rem] font-semibold text-ink">Sendt tidligere</h2>
            <ul className="mt-3 divide-y divide-fog">
              {history.map((h) => (
                <li key={h.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-[0.92rem] leading-relaxed text-ink">{h.text}</p>
                  <p className="mt-0.5 text-[0.78rem] text-slate">
                    {when(h.sentAt)} · {kort(h.recipients)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-[0.82rem] leading-relaxed text-stone">
          Du kan sende én pushbesked i døgnet. Kunderne kan slå dem fra på bagsiden af kortet
          {optedOut > 0 ? `, og ${optedOut} har gjort det` : ""}.
        </p>
      </div>

      <aside aria-label="Forhåndsvisning" className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
        <LockScreen shopName={shopName} text={sentTo !== null ? sentText : trimmed || current || ""} landed={sentTo !== null} />
      </aside>
    </div>
  );
}
