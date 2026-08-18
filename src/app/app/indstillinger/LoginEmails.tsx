"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import {
  addLoginEmail,
  removeLoginEmail,
  resendLoginLink,
} from "./login-actions";

type LoginEmail = {
  id: string;
  email: string;
  isYou: boolean;
  verified: boolean;
};

function Msg({ text, ok }: { text: string; ok: boolean }) {
  return (
    <span
      className={`text-[0.8rem] font-[300] ${ok ? "text-terracotta" : "text-rust"}`}
    >
      {text}
    </span>
  );
}

export function LoginEmails({ emails }: { emails: LoginEmail[] }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const email = value.trim();
    if (!email) return;
    start(async () => {
      const res = await addLoginEmail(email);
      if (res.ok) {
        setValue("");
        setMsg({ ok: true, text: "Tilføjet. Vi har sendt et login-link." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  function remove(id: string) {
    setConfirmId(null);
    setMsg(null);
    start(async () => {
      const res = await removeLoginEmail(id);
      if (res.ok) router.refresh();
      else setMsg({ ok: false, text: res.error });
    });
  }

  function resend(id: string) {
    setMsg(null);
    start(async () => {
      const res = await resendLoginLink(id);
      setMsg(
        res.ok
          ? { ok: true, text: "Login-link sendt." }
          : { ok: false, text: res.error },
      );
    });
  }

  return (
    <section className="rounded-lg border border-fog bg-white p-6 shadow-card md:p-8">
      <div className="flex flex-col gap-1">
        <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
          Login-adgang
        </span>
        <h2 className="font-[300] text-[1.3rem] text-ink">
          Log ind fra flere steder
        </h2>
        <p className="mt-1 max-w-xl font-[300] text-[0.88rem] leading-relaxed text-stone">
          Tilføj flere e-mails, der kan logge ind på butikken. Alle logger ind
          med et link i mailen, ingen adgangskode. Alle med login-adgang har fuld
          adgang til butikken.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2.5">
        {emails.map((u) => (
          <div
            key={u.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-fog px-4 py-3"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="truncate font-[400] text-[0.92rem] text-ink">
                {u.email}
              </span>
              {u.isYou ? (
                <span className="shrink-0 rounded-full bg-terracotta/10 px-2 py-0.5 text-[0.62rem] font-[500] uppercase tracking-[0.08em] text-terracotta">
                  Dig
                </span>
              ) : !u.verified ? (
                <span className="shrink-0 rounded-full bg-sand px-2 py-0.5 text-[0.62rem] font-[500] uppercase tracking-[0.08em] text-slate">
                  Afventer
                </span>
              ) : null}
            </div>

            {u.isYou ? (
              <span className="shrink-0 text-[0.72rem] font-[300] text-slate">
                Din adgang
              </span>
            ) : confirmId === u.id ? (
              <div className="flex shrink-0 items-center gap-3">
                <span className="text-[0.74rem] font-[300] text-stone">
                  Fjern adgang?
                </span>
                <button
                  onClick={() => remove(u.id)}
                  disabled={pending}
                  className="text-[0.72rem] font-[500] uppercase tracking-[0.08em] text-rust transition-opacity hover:opacity-70 disabled:opacity-50"
                >
                  Bekræft
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  disabled={pending}
                  className="text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink disabled:opacity-50"
                >
                  Fortryd
                </button>
              </div>
            ) : (
              <div className="flex shrink-0 items-center gap-4">
                <button
                  onClick={() => resend(u.id)}
                  disabled={pending}
                  className="text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink disabled:opacity-50"
                >
                  Send login-link
                </button>
                <button
                  onClick={() => setConfirmId(u.id)}
                  className="text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-rust"
                >
                  Fjern
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={add} className="mt-5 flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="navn@butik.dk"
            autoComplete="email"
            className="w-full rounded-md border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.92rem] text-ink outline-none focus:border-terracotta sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={pending}
            className={`${btnClass("primary")} shrink-0 disabled:opacity-60`}
          >
            {pending ? "Tilføjer..." : "Tilføj login-mail"}
          </button>
        </div>
        {msg ? <Msg text={msg.text} ok={msg.ok} /> : null}
      </form>
    </section>
  );
}
