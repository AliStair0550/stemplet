"use client";

import { useState, useTransition } from "react";
import { NEWS_MAX } from "@/lib/news";
import { formatDkDate } from "@/lib/utils";
import { clearNewsAction, sendNewsAction } from "./actions";

const IDEAS = [
  "Vi har nye åbningstider fra mandag: 7 til 17.",
  "Dobbelt stempel hele weekenden. Vi glæder os til at se dig.",
  "Tak for et godt år. Vi holder lukket 24. til 26. december.",
];

const time = (iso: string) =>
  new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

export function NewsComposer({
  shopName,
  current,
  sentAt,
  nextAllowedAt,
  inWallet,
  cardholders,
}: {
  shopName: string;
  current: string | null;
  sentAt: string | null;
  nextAllowedAt: string | null;
  inWallet: number;
  cardholders: number;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const locked = Boolean(nextAllowedAt);
  const preview = text.trim() || "Din besked vises her.";
  const day = new Intl.DateTimeFormat("da-DK", { timeZone: "Europe/Copenhagen", weekday: "long", day: "numeric", month: "long" }).format(new Date());
  const today = day.charAt(0).toUpperCase() + day.slice(1);

  function send() {
    setError(null);
    if (!window.confirm(`Send beskeden til ${inWallet} kort i Wallet? Den vises på kundernes låseskærm.`)) return;
    start(async () => {
      const res = await sendNewsAction(text);
      if (res.ok) {
        setSent(true);
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

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
          <label htmlFor="news" className="text-[1.05rem] font-semibold text-ink">
            Ny besked
          </label>
          <textarea
            id="news"
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, NEWS_MAX));
              setSent(false);
            }}
            maxLength={NEWS_MAX}
            rows={3}
            disabled={locked || pending}
            placeholder="Fx Vi har nye åbningstider fra mandag: 7 til 17."
            className="mt-3 w-full resize-none rounded-xl border border-fog px-4 py-3 text-[0.98rem] leading-relaxed text-ink outline-none disabled:opacity-60"
          />
          <div className="mt-1.5 flex items-center justify-between text-[0.78rem] text-slate">
            <span>Kort og konkret virker bedst.</span>
            <span className="tabular-nums">
              {text.length}/{NEWS_MAX}
            </span>
          </div>
          {!locked ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {IDEAS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setText(i)}
                  className="rounded-full border border-clay px-3 py-1.5 text-left text-[0.8rem] text-stone hover:border-ink hover:text-ink"
                >
                  {i}
                </button>
              ))}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="mt-4 text-[0.88rem] text-rust">
              {error}
            </p>
          ) : null}
          {sent ? (
            <p role="status" className="mt-4 rounded-xl bg-sand px-4 py-3 text-[0.88rem] text-ink">
              Sendt. Kortene opdateres i løbet af få minutter.
            </p>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={send}
              disabled={locked || pending || !text.trim() || inWallet === 0}
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-6 text-[0.92rem] font-semibold text-white hover:bg-[#0A2D5A] disabled:opacity-50"
            >
              {pending ? "Sender..." : `Send til ${inWallet} kort`}
            </button>
            <span className="text-[0.82rem] text-stone">
              {locked && nextAllowedAt
                ? `Du kan sende igen ${formatDkDate(new Date(nextAllowedAt))} kl. ${time(nextAllowedAt)}.`
                : inWallet === 0
                  ? "Ingen kort i Wallet endnu. Beskeden kan sendes, når den første kunde har hentet kortet."
                  : `${inWallet} af ${cardholders} kortholdere har kortet i Wallet. Én besked i døgnet.`}
            </span>
          </div>
        </section>

        {current ? (
          <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
            <h2 className="text-[1.05rem] font-semibold text-ink">På kortene nu</h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-ink">{current}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.82rem] text-stone">
              {sentAt ? <span>Sendt {formatDkDate(new Date(sentAt))} kl. {time(sentAt)}</span> : null}
              <button type="button" onClick={clear} disabled={pending} className="underline underline-offset-4 hover:text-ink disabled:opacity-50">
                Fjern fra kortene
              </button>
            </div>
          </section>
        ) : null}

        <p className="text-[0.82rem] leading-relaxed text-stone">
          Beskeden står også på bagsiden af kortet, til du sender en ny eller fjerner den. Brug den til nyheder om
          butikken og kortet. Apple kan begrænse kort, der sender for mange eller irrelevante beskeder.
        </p>
      </div>

      {/* Saadan ser det ud paa kundens laaseskaerm. */}
      <aside aria-label="Forhåndsvisning" className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-[28px] bg-gradient-to-b from-[#0A2D5A] to-[#020B1C] p-5 pb-10 text-white">
          <p className="text-center text-[2.6rem] font-semibold leading-none tracking-[-0.03em]">9.41</p>
          <p className="mt-1 text-center text-[0.8rem] text-white/70">{today}</p>
          <div className="mt-6 rounded-[18px] bg-white/85 p-3 text-[#0B1628] backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-[7px] bg-[#061C3D] text-[0.6rem] font-bold text-white">
                {shopName.slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-[0.8rem] font-semibold">{shopName}</span>
              <span className="ml-auto text-[0.72rem] text-[#5F6B7E]">nu</span>
            </div>
            <p className="mt-1.5 break-words text-[0.85rem] leading-snug">{preview}</p>
          </div>
        </div>
        <p className="mt-3 text-center text-[0.78rem] text-slate">Sådan ser kunderne det</p>
      </aside>
    </div>
  );
}
