"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, deleteCampaign } from "../actions";
import { btnClass } from "@/components/ui";
import { formatDkDate } from "@/lib/utils";

type CampaignType = "DOUBLE_STAMP" | "WELCOME_BONUS";

type Campaign = {
  id: string;
  type: CampaignType;
  startsAt: string;
  endsAt: string;
};

const TYPES: Record<
  CampaignType,
  { label: string; desc: string; icon: React.ReactNode }
> = {
  DOUBLE_STAMP: {
    label: "Dobbeltstempel",
    desc: "Hvert stempel tæller dobbelt i perioden. Godt til stille dage eller en lancering.",
    icon: <IconDouble />,
  },
  WELCOME_BONUS: {
    label: "Velkomstbonus",
    desc: "Nye kunders allerførste stempel tæller ekstra. Godt til at få folk i gang.",
    icon: <IconGift />,
  },
};

function campaignStatus(startsAt: string, endsAt: string) {
  const now = Date.now();
  const s = new Date(startsAt).getTime();
  const e = new Date(endsAt).getTime();
  if (now < s) return "upcoming" as const;
  if (now > e) return "ended" as const;
  return "active" as const;
}

const STATUS: Record<
  "active" | "upcoming" | "ended",
  { label: string; cls: string }
> = {
  active: { label: "Aktiv", cls: "bg-terracotta/10 text-terracotta" },
  upcoming: { label: "Kommende", cls: "bg-clay/40 text-stone" },
  ended: { label: "Afsluttet", cls: "bg-fog text-slate" },
};

export function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<CampaignType>("DOUBLE_STAMP");

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createCampaign(fd);
      if (res.ok) {
        form.reset();
        setType("DOUBLE_STAMP");
        router.refresh();
      } else {
        setError(res.error ?? "Noget gik galt.");
      }
    });
  }

  function onDelete(id: string) {
    start(async () => {
      await deleteCampaign(id);
      router.refresh();
    });
  }

  const active = campaigns.filter(
    (c) => campaignStatus(c.startsAt, c.endsAt) === "active",
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Vaelg type som to kort, saa det er tydeligt hvad de goer */}
      <form
        onSubmit={onCreate}
        className="flex flex-col gap-5 rounded-lg border border-fog bg-white shadow-card p-6"
      >
        <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Ny kampagne
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(TYPES) as CampaignType[]).map((key) => {
            const t = TYPES[key];
            const selected = type === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors ${
                  selected
                    ? "border-terracotta bg-terracotta/[0.04]"
                    : "border-fog hover:border-clay"
                }`}
              >
                <span
                  className={`flex items-center gap-2 font-[400] text-[0.95rem] ${
                    selected ? "text-terracotta" : "text-ink"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </span>
                <span className="text-[0.8rem] font-[200] leading-relaxed text-stone">
                  {t.desc}
                </span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="type" value={type} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Starter
            </span>
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="border border-clay bg-parchment px-3 py-2.5 font-[200] text-[0.9rem] text-ink outline-none focus:border-terracotta"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Slutter
            </span>
            <input
              type="datetime-local"
              name="endsAt"
              required
              className="border border-clay bg-parchment px-3 py-2.5 font-[200] text-[0.9rem] text-ink outline-none focus:border-terracotta"
            />
          </label>
        </div>

        {error ? (
          <p className="text-[0.8rem] font-[300] text-rust">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={btnClass("terracotta") + " self-start"}
        >
          {pending ? "Opretter..." : "Opret kampagne"}
        </button>
      </form>

      {/* Liste */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
            Dine kampagner
          </h2>
          {active.length > 0 ? (
            <span className="text-[0.72rem] font-[200] text-terracotta">
              {active.length} aktiv{active.length === 1 ? "" : "e"} lige nu
            </span>
          ) : null}
        </div>

        {campaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-clay bg-white/50 px-6 py-8 text-center">
            <p className="font-[300] text-[0.95rem] text-ink">
              Ingen kampagner endnu
            </p>
            <p className="mx-auto mt-1 max-w-sm text-[0.82rem] font-[200] leading-relaxed text-stone">
              Kør en kampagne, når du vil give kunderne et ekstra skub. Vælg en
              type ovenfor, sæt en periode, og se effekten i statistikken.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {campaigns.map((c) => {
              const t = TYPES[c.type];
              const status = campaignStatus(c.startsAt, c.endsAt);
              const s = STATUS[status];
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-fog bg-white shadow-card px-5 py-4"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        status === "active"
                          ? "bg-terracotta/10 text-terracotta"
                          : "bg-fog text-slate"
                      }`}
                    >
                      {t.icon}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-[400] text-[0.95rem] text-ink">
                          {t.label}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.6rem] font-[500] uppercase tracking-[0.1em] ${s.cls}`}
                        >
                          {s.label}
                        </span>
                      </div>
                      <div className="mt-0.5 text-[0.78rem] font-[200] text-slate">
                        {formatDkDate(c.startsAt)} til {formatDkDate(c.endsAt)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(c.id)}
                    disabled={pending}
                    className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate transition-colors hover:text-rust"
                  >
                    Slet
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Ikoner ───────────────────────────────────────────────────────────
function IconDouble() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ height: "1.1rem", width: "1.1rem" }}
    >
      <circle cx="9" cy="9" r="5" />
      <circle cx="15" cy="15" r="5" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ height: "1.1rem", width: "1.1rem" }}
    >
      <path d="M20 12v8H4v-8M2 8h20v4H2zM12 8v12M12 8S10 3 7 5s5 3 5 3ZM12 8s2-5 5-3-5 3-5 3Z" />
    </svg>
  );
}
