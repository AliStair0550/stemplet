"use client";

import { useState, useTransition } from "react";
import { saveSettings, setPin } from "../actions";
import { btnClass } from "@/components/ui";
import { Panel } from "@/components/dash";

function Msg({ text }: { text: string | null }) {
  if (!text) return null;
  return <span className="text-[0.8rem] font-[200] text-moss">{text}</span>;
}

export function SettingsForms({
  name,
  cooldown,
}: {
  name: string;
  cooldown: number;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [pinPending, startPin] = useTransition();
  const [pinMsg, setPinMsg] = useState<string | null>(null);

  function onSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveSettings(fd);
      setMsg(res.ok ? "Gemt" : (res.error ?? "Fejl"));
    });
  }

  function onPin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPinMsg(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startPin(async () => {
      const res = await setPin(fd);
      setPinMsg(res.ok ? "PIN opdateret" : (res.error ?? "Fejl"));
      if (res.ok) form.reset();
    });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Panel>
        <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Virksomhed
        </h2>
        <form onSubmit={onSettings} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Navn
            </span>
            <input
              name="name"
              defaultValue={name}
              className="border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-moss"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Stempel-interval (minutter)
            </span>
            <input
              name="stampCooldownMin"
              type="number"
              min={0}
              max={1440}
              defaultValue={cooldown}
              className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-moss"
            />
            <span className="text-[0.72rem] font-[200] text-slate">
              Maks. eet stempel pr. kunde i dette interval.
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className={btnClass("primary")}
            >
              {pending ? "Gemmer..." : "Gem"}
            </button>
            <Msg text={msg} />
          </div>
        </form>
      </Panel>

      <Panel>
        <h2 className="mb-4 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Personale-PIN
        </h2>
        <form onSubmit={onPin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Ny PIN (4 til 6 cifre)
            </span>
            <input
              name="pin"
              inputMode="numeric"
              placeholder="****"
              className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[200] tracking-[0.3em] text-ink outline-none focus:border-moss"
            />
            <span className="text-[0.72rem] font-[200] text-slate">
              Kræves ved indløsning af belønninger.
            </span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pinPending}
              className={btnClass("primary")}
            >
              {pinPending ? "Gemmer..." : "Opdater PIN"}
            </button>
            <Msg text={pinMsg} />
          </div>
        </form>
      </Panel>
    </div>
  );
}
