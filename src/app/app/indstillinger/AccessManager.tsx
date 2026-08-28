"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import {
  addLoginEmail,
  removeLoginEmail,
  resendLoginLink,
} from "./login-actions";
import {
  createPairingCodeAction,
  revokeDeviceAction,
} from "./device-actions";

type LoginEmail = {
  id: string;
  email: string;
  isYou: boolean;
  verified: boolean;
};

type Device = {
  id: string;
  name: string;
  lastSeenAt: string | null;
  createdAt: string;
};

type Mode = "full" | "kasse";

function Msg({ text, ok }: { text: string; ok: boolean }) {
  return (
    <span
      className={`text-[0.8rem] font-[200] ${ok ? "text-terracotta" : "text-rust"}`}
    >
      {text}
    </span>
  );
}

function lastSeenText(iso: string | null): string {
  if (!iso) return "Ikke set endnu";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "Aktiv nu";
  if (min < 60) return `Sidst set for ${min} min. siden`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Sidst set for ${hrs} ${hrs === 1 ? "time" : "timer"} siden`;
  const days = Math.floor(hrs / 24);
  return `Sidst set for ${days} ${days === 1 ? "dag" : "dage"} siden`;
}

export function AccessManager({
  emails,
  devices,
}: {
  emails: LoginEmail[];
  devices: Device[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("full");
  const [pending, start] = useTransition();

  // Fuld adgang (login-mail)
  const [value, setValue] = useState("");
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(
    null,
  );
  const [confirmEmailId, setConfirmEmailId] = useState<string | null>(null);

  // Kasse-enhed (parring)
  const [pairing, setPairing] = useState<{
    code: string;
    qrDataUrl: string;
  } | null>(null);
  const [confirmDeviceId, setConfirmDeviceId] = useState<string | null>(null);

  function addEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailMsg(null);
    const email = value.trim();
    if (!email) return;
    start(async () => {
      const res = await addLoginEmail(email);
      if (res.ok) {
        setValue("");
        setEmailMsg({ ok: true, text: "Tilføjet. Vi har sendt et login-link." });
        router.refresh();
      } else {
        setEmailMsg({ ok: false, text: res.error });
      }
    });
  }

  function removeEmail(id: string) {
    setConfirmEmailId(null);
    setEmailMsg(null);
    start(async () => {
      const res = await removeLoginEmail(id);
      if (res.ok) router.refresh();
      else setEmailMsg({ ok: false, text: res.error });
    });
  }

  function resend(id: string) {
    setEmailMsg(null);
    start(async () => {
      const res = await resendLoginLink(id);
      setEmailMsg(
        res.ok
          ? { ok: true, text: "Login-link sendt." }
          : { ok: false, text: res.error },
      );
    });
  }

  function newCode() {
    start(async () => {
      const res = await createPairingCodeAction();
      setPairing({ code: res.code, qrDataUrl: res.qrDataUrl });
    });
  }

  function closePairing() {
    setPairing(null);
    router.refresh();
  }

  function revoke(id: string) {
    setConfirmDeviceId(null);
    start(async () => {
      await revokeDeviceAction(id);
      router.refresh();
    });
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md px-4 py-2.5 text-[0.82rem] font-[400] transition-colors ${
      active
        ? "bg-white text-ink shadow-card"
        : "text-slate hover:text-ink"
    }`;

  return (
    <section
      id="adgang"
      className="scroll-mt-24 rounded-lg border border-fog bg-white p-6 shadow-card md:p-8"
    >
      <div className="flex flex-col gap-1">
        <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
          Adgang
        </span>
        <h2 className="font-[300] text-[1.3rem] text-ink">
          Hvem har adgang til butikken
        </h2>
        <p className="mt-1 max-w-xl font-[300] text-[0.88rem] leading-relaxed text-stone">
          Vælg hvad hver adgang skal kunne: fuld adgang til dashboardet, eller en
          kasse der kun kan stemple.
        </p>
      </div>

      {/* Vælg type ved tilføjelse */}
      <div className="mt-6 flex gap-1 rounded-lg border border-fog bg-parchment p-1">
        <button
          type="button"
          onClick={() => setMode("full")}
          className={tabClass(mode === "full")}
        >
          Fuld adgang (login-mail)
        </button>
        <button
          type="button"
          onClick={() => setMode("kasse")}
          className={tabClass(mode === "kasse")}
        >
          Kun kasse (stempel)
        </button>
      </div>

      {mode === "full" ? (
        <div className="mt-5">
          <p className="max-w-xl font-[300] text-[0.85rem] leading-relaxed text-stone">
            Personen logger ind med et link i mailen, ingen adgangskode, og kan se
            og ændre alt i butikken.
          </p>
          <form onSubmit={addEmail} className="mt-4 flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="navn@butik.dk"
                autoComplete="email"
                aria-label="Ny login-mail"
                className="w-full border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.92rem] text-ink outline-none focus:border-terracotta sm:max-w-xs"
              />
              <button
                type="submit"
                disabled={pending}
                className={`${btnClass("primary")} shrink-0 disabled:opacity-60`}
              >
                {pending ? "Tilføjer..." : "Tilføj login-mail"}
              </button>
            </div>
            {emailMsg ? <Msg text={emailMsg.text} ok={emailMsg.ok} /> : null}
          </form>
        </div>
      ) : (
        <div className="mt-5">
          <p className="max-w-xl font-[300] text-[0.85rem] leading-relaxed text-stone">
            Par en iPad eller telefon som fast kasse. Den kan vise QR, scanne kort
            og stemple, men aldrig se dine indstillinger, priser eller kunder. Du
            kan spærre en enhed når som helst.
          </p>
          <button
            onClick={newCode}
            disabled={pending}
            className={`${btnClass("primary")} mt-4`}
          >
            {pending ? "Et øjeblik..." : "Par en ny enhed"}
          </button>
        </div>
      )}

      {/* Fuld adgang: liste */}
      {emails.length > 0 ? (
        <div className="mt-8">
          <h3 className="mb-3 text-[0.62rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Fuld adgang
          </h3>
          <div className="flex flex-col gap-2.5">
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
                ) : confirmEmailId === u.id ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[0.74rem] font-[300] text-stone">
                      Fjern adgang?
                    </span>
                    <button
                      onClick={() => removeEmail(u.id)}
                      disabled={pending}
                      className="text-[0.72rem] font-[500] uppercase tracking-[0.08em] text-rust transition-opacity hover:opacity-70 disabled:opacity-50"
                    >
                      Bekræft
                    </button>
                    <button
                      onClick={() => setConfirmEmailId(null)}
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
                      onClick={() => setConfirmEmailId(u.id)}
                      className="text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-rust"
                    >
                      Fjern
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Kasse-enheder: liste */}
      <div className="mt-8">
        <h3 className="mb-3 text-[0.62rem] font-[500] uppercase tracking-[0.14em] text-slate">
          Kasse-enheder
        </h3>
        {devices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-clay px-4 py-6 text-center font-[300] text-[0.86rem] text-slate">
            Ingen enheder parret endnu.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {devices.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-fog px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4"
                    >
                      <rect x="5" y="2" width="14" height="20" rx="2.5" />
                      <path d="M11 18h2" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-[400] text-[0.92rem] text-ink">
                      {d.name}
                    </p>
                    <p className="font-[300] text-[0.78rem] text-slate">
                      {lastSeenText(d.lastSeenAt)}
                    </p>
                  </div>
                </div>
                {confirmDeviceId === d.id ? (
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-[0.74rem] font-[300] text-stone">
                      Spær enheden?
                    </span>
                    <button
                      onClick={() => revoke(d.id)}
                      disabled={pending}
                      className="text-[0.72rem] font-[500] uppercase tracking-[0.08em] text-rust transition-opacity hover:opacity-70 disabled:opacity-50"
                    >
                      Bekræft
                    </button>
                    <button
                      onClick={() => setConfirmDeviceId(null)}
                      disabled={pending}
                      className="text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-ink disabled:opacity-50"
                    >
                      Fortryd
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeviceId(d.id)}
                    className="shrink-0 text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-rust"
                  >
                    Spær
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {pairing ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-6"
          onClick={closePairing}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col items-center gap-5 rounded-lg bg-parchment p-8 text-center"
          >
            <h3 className="font-[300] text-[1.3rem] text-ink">Par en ny enhed</h3>
            <p className="max-w-xs font-[300] text-[0.86rem] leading-relaxed text-stone">
              På enheden: åbn{" "}
              <span className="font-[400] text-ink">stemplet.alius.dk/kasse</span>{" "}
              og indtast koden, eller scan QR-koden.
            </p>
            <div className="rounded-lg border border-fog bg-white shadow-card p-3">
              <Image
                src={pairing.qrDataUrl}
                alt="Parrings-QR"
                width={200}
                height={200}
                className="h-44 w-44"
                unoptimized
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[0.62rem] font-[400] uppercase tracking-[0.14em] text-slate">
                Kode
              </span>
              <span className="font-[400] text-[1.9rem] tracking-[0.3em] text-ink">
                {pairing.code}
              </span>
            </div>
            <p className="text-[0.74rem] font-[300] text-slate">
              Koden udløber om 10 minutter.
            </p>
            <button onClick={closePairing} className={btnClass("outline")}>
              Færdig
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
