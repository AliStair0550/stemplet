"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCampaign, deleteCampaign } from "../actions";
import { btnClass } from "@/components/ui";
import { formatDkDate } from "@/lib/utils";

type Campaign = {
  id: string;
  type: "DOUBLE_STAMP" | "WELCOME_BONUS";
  startsAt: string;
  endsAt: string;
};

const TYPE_LABEL: Record<Campaign["type"], string> = {
  DOUBLE_STAMP: "Dobbeltstempel",
  WELCOME_BONUS: "Velkomstbonus",
};

export function CampaignManager({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    start(async () => {
      const res = await createCampaign(fd);
      if (res.ok) {
        form.reset();
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

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={onCreate}
        className="flex flex-col gap-4 rounded-sm border border-fog bg-white p-6"
      >
        <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Ny kampagne
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Type
            </span>
            <select
              name="type"
              className="border border-clay bg-parchment px-3 py-2.5 font-[200] text-[0.9rem] text-ink outline-none focus:border-moss"
            >
              <option value="DOUBLE_STAMP">Dobbeltstempel</option>
              <option value="WELCOME_BONUS">Velkomstbonus</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Start
            </span>
            <input
              type="datetime-local"
              name="startsAt"
              required
              className="border border-clay bg-parchment px-3 py-2.5 font-[200] text-[0.9rem] text-ink outline-none focus:border-moss"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Slut
            </span>
            <input
              type="datetime-local"
              name="endsAt"
              required
              className="border border-clay bg-parchment px-3 py-2.5 font-[200] text-[0.9rem] text-ink outline-none focus:border-moss"
            />
          </label>
        </div>
        {error ? (
          <p className="text-[0.8rem] font-[200] text-moss">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={btnClass("primary") + " self-start"}
        >
          {pending ? "Opretter..." : "Opret kampagne"}
        </button>
      </form>

      <div className="flex flex-col gap-3">
        <h2 className="text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Kampagner
        </h2>
        {campaigns.length === 0 ? (
          <p className="font-[200] text-[0.85rem] text-slate">
            Ingen kampagner endnu.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {campaigns.map((c) => {
              const now = Date.now();
              const active =
                new Date(c.startsAt).getTime() <= now &&
                new Date(c.endsAt).getTime() >= now;
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-fog bg-white px-5 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-[300] text-[0.95rem] text-ink">
                        {TYPE_LABEL[c.type]}
                      </span>
                      {active ? (
                        <span className="rounded-full bg-moss/10 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.1em] text-moss">
                          Aktiv
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[0.75rem] font-[200] text-slate">
                      {formatDkDate(c.startsAt)} - {formatDkDate(c.endsAt)}
                    </div>
                  </div>
                  <button
                    onClick={() => onDelete(c.id)}
                    disabled={pending}
                    className="text-[0.72rem] font-[300] uppercase tracking-[0.1em] text-slate hover:text-ink"
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
