"use client";

import { useState, useTransition } from "react";
import { saveSettings, setPin, clearStaffPin } from "../actions";
import { btnClass } from "@/components/ui";
import { Panel } from "@/components/dash";
import { BUSINESS_CATEGORIES } from "@/lib/categories";

function Msg({ text, ok = true }: { text: string | null; ok?: boolean }) {
  if (!text) return null;
  return (
    <span className={`text-[0.8rem] font-[200] ${ok ? "text-terracotta" : "text-rust"}`}>
      {text}
    </span>
  );
}

export function SettingsForms({
  name,
  cooldown,
  category,
  selfScan,
  hasPin,
}: {
  name: string;
  cooldown: number;
  category: string | null;
  selfScan: boolean;
  hasPin: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pinPending, startPin] = useTransition();
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  function onSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveSettings(fd);
      setMsg(
        res.ok
          ? { ok: true, text: "Gemt" }
          : { ok: false, text: res.error ?? "Fejl" },
      );
    });
  }

  function onPin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPinMsg(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startPin(async () => {
      const res = await setPin(fd);
      setPinMsg(
        res.ok
          ? { ok: true, text: "PIN opdateret" }
          : { ok: false, text: res.error ?? "Fejl" },
      );
      if (res.ok) form.reset();
    });
  }

  function onClearPin() {
    setPinMsg(null);
    startPin(async () => {
      const res = await clearStaffPin();
      setPinMsg(
        res.ok
          ? { ok: true, text: "PIN slået fra" }
          : { ok: false, text: res.error ?? "Fejl" },
      );
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
              className="border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-terracotta"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Branche
            </span>
            <select
              name="category"
              defaultValue={category ?? ""}
              className="border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-terracotta"
            >
              <option value="">Vælg branche</option>
              {BUSINESS_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <span className="text-[0.72rem] font-[200] text-slate">
              Bruges til at give dig bedre indsigt senere.
            </span>
          </label>
          {/* Cooldown gaelder KUN selvbetjening (kunde-scanning). Vises derfor
              kun naar selvbetjening er slaaet til; ellers sendes vaerdien blot
              uaendret med, saa den bevares. */}
          {selfScan ? (
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
                Selvbetjenings-interval (minutter)
              </span>
              <input
                name="stampCooldownMin"
                type="number"
                min={0}
                max={1440}
                defaultValue={cooldown}
                className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.92rem] text-ink outline-none focus:border-terracotta"
              />
              <span className="text-[0.72rem] font-[300] leading-relaxed text-slate">
                Hvor længe før den samme kunde selv kan scanne igen. Personalet
                kan altid give stempler uden ventetid. Standard er 15 min.
              </span>
            </label>
          ) : (
            <input type="hidden" name="stampCooldownMin" value={cooldown} />
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className={btnClass("primary")}
            >
              {pending ? "Gemmer..." : "Gem"}
            </button>
            <Msg text={msg?.text ?? null} ok={msg?.ok} />
          </div>
        </form>
      </Panel>

      <Panel>
        <h2 className="mb-2 text-[0.7rem] font-[400] uppercase tracking-[0.14em] text-slate">
          Personale-PIN (valgfri)
        </h2>
        <p className="mb-4 font-[300] text-[0.84rem] leading-relaxed text-stone">
          {hasPin
            ? "Slået til: personalet skal indtaste PIN'en for at indløse en belønning."
            : "Slået fra: enhver ved kassen kan indløse belønninger. Slå den til for et ekstra tjek."}
        </p>
        <form onSubmit={onPin} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              {hasPin ? "Skift PIN (4 til 6 cifre)" : "Sæt en PIN (4 til 6 cifre)"}
            </span>
            <input
              name="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="****"
              className="w-40 border border-clay bg-parchment px-4 py-2.5 font-[300] tracking-[0.3em] text-ink outline-none focus:border-terracotta"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={pinPending}
              className={btnClass("primary")}
            >
              {pinPending ? "Gemmer..." : hasPin ? "Skift PIN" : "Slå PIN til"}
            </button>
            {hasPin ? (
              <button
                type="button"
                onClick={onClearPin}
                disabled={pinPending}
                className={btnClass("outline")}
              >
                Slå PIN fra
              </button>
            ) : null}
            <Msg text={pinMsg?.text ?? null} ok={pinMsg?.ok} />
          </div>
        </form>
      </Panel>
    </div>
  );
}
