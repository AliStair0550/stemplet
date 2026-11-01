"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/dash";
import { btnClass } from "@/components/ui";
import { APP_HOST } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { addMember, removeMember, resendLoginLink, setMemberRole } from "./actions";
import { createPairingCodeAction, revokeDeviceAction } from "./device-actions";

type Role = "OWNER" | "STAFF";

type Member = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  isYou: boolean;
  verified: boolean;
};

type Device = {
  id: string;
  name: string;
  lastSeenAt: string | null;
};

const ROLES: { value: Role; title: string; text: string; icon: React.ReactNode }[] = [
  {
    value: "STAFF",
    title: "Kun kassen",
    text: "Scanner kort og giver stempler. Ser ikke kunder eller indstillinger.",
    icon: <path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M7 12h10" />,
  },
  {
    value: "OWNER",
    title: "Adgang til alt",
    text: "Kan se og ændre alt, ligesom dig.",
    icon: (
      <>
        <circle cx="8.5" cy="15.5" r="3.5" />
        <path d="m11 13 8-8M16 8l2.5 2.5M14 10l2 2" />
      </>
    ),
  },
];

function RoleIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-[1.1rem] w-[1.1rem]" aria-hidden>
      {children}
    </svg>
  );
}

/** Lille maerke i listen: rolle, "Dig" eller "Inviteret". */
function Chip({ tone, children }: { tone: "blue" | "gray" | "amber"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[0.74rem] font-[600]",
        tone === "blue" && "bg-[#E8F0FB] text-[#1B5EAE]",
        tone === "gray" && "bg-[#F2F5F9] text-[#5F6B7E]",
        tone === "amber" && "bg-[#FDF3DC] text-[#8A5A00]",
      )}
    >
      {children}
    </span>
  );
}

// Listerne er kant-til-kant (Panel har fast indre luft, som cn ikke overskriver).
const LIST = "overflow-hidden rounded-[18px] border border-fog bg-white shadow-card";

const input =
  "min-h-12 w-full rounded-full border border-clay bg-white px-5 text-[1rem] text-ink outline-none placeholder:text-slate focus:border-ink";

function lastSeenText(iso: string | null): string {
  if (!iso) return "Ikke brugt endnu";
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "Aktiv nu";
  if (min < 60) return `Brugt for ${min} min. siden`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `Brugt for ${hrs} ${hrs === 1 ? "time" : "timer"} siden`;
  const days = Math.floor(hrs / 24);
  return `Brugt for ${days} ${days === 1 ? "dag" : "dage"} siden`;
}

function initial(m: Member): string {
  return (m.name ?? m.email).trim().charAt(0).toUpperCase();
}

export function TeamManager({
  members,
  devices,
  businessName,
}: {
  members: Member[];
  devices: Device[];
  businessName: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  // Tilfoej medarbejder. Det almindelige er kun kassen.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("STAFF");
  const [addMsg, setAddMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Handlinger paa en raekke: hvilken er aaben, og hvilken skal bekraeftes.
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [rowMsg, setRowMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  // Faelles kasse-enhed (parring uden login)
  const [pairing, setPairing] = useState<{ code: string; qrDataUrl: string; url: string } | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmDeviceId, setConfirmDeviceId] = useState<string | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    setAddMsg(null);
    if (!email.trim()) {
      setAddMsg({ ok: false, text: "Skriv medarbejderens e-mail." });
      return;
    }
    const who = name.trim() || email.trim();
    start(async () => {
      const res = await addMember({ name, email, role });
      if (res.ok) {
        setName("");
        setEmail("");
        setAddMsg({
          ok: true,
          text: `${who} har fået en mail med login. Næste gang logger de ind på ${APP_HOST}/login.`,
        });
        router.refresh();
      } else {
        setAddMsg({ ok: false, text: res.error });
      }
    });
  }

  function toggleRow(id: string) {
    setOpenId(openId === id ? null : id);
    setConfirmId(null);
    setRowMsg(null);
  }

  function resend(id: string) {
    start(async () => {
      const res = await resendLoginLink(id);
      setRowMsg({ id, ok: res.ok, text: res.ok ? "Login sendt." : res.error });
    });
  }

  function changeRole(id: string, next: Role) {
    start(async () => {
      const res = await setMemberRole(id, next);
      if (res.ok) {
        setRowMsg({ id, ok: true, text: next === "OWNER" ? "Har nu adgang til alt." : "Har nu kun kassen." });
        router.refresh();
      } else {
        setRowMsg({ id, ok: false, text: res.error });
      }
    });
  }

  function remove(id: string) {
    start(async () => {
      const res = await removeMember(id);
      if (res.ok) {
        setOpenId(null);
        setConfirmId(null);
        router.refresh();
      } else {
        setRowMsg({ id, ok: false, text: res.error });
      }
    });
  }

  function newCode() {
    start(async () => {
      const res = await createPairingCodeAction();
      setPairing({ code: res.code, qrDataUrl: res.qrDataUrl, url: res.url });
      setLinkCopied(false);
    });
  }

  // Send kasse-linket (SMS, Messenger ...). Ellers kopieres det.
  async function sharePairing() {
    if (!pairing) return;
    const text = `Her er kassen til ${businessName}. Åbn linket på telefonen eller iPad'en:`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Kasse", text, url: pairing.url });
        return;
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(pairing.url);
      setLinkCopied(true);
    } catch {
      // Kunne ikke kopiere: QR-koden og koden virker stadig.
    }
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

  const textBtn =
    "rounded-full px-3 py-1.5 text-[0.85rem] font-[500] text-ink transition-colors hover:bg-sand disabled:opacity-50";

  return (
    <div className="flex flex-col gap-10">
      {/* Tilfoej */}
      <Panel className="md:p-8">
        <h2 className="text-[1.15rem] font-[600] tracking-[-0.01em] text-ink">Tilføj en medarbejder</h2>
        {/* Saadan virker det: tre korte trin. */}
        <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[0.85rem] text-stone">
          {["Skriv navn og mail", "De får en mail med login", "De logger ind på deres egen telefon"].map((t, i) => (
            <li key={t} className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F0FB] text-[0.72rem] font-[700] text-[#1B5EAE]">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ol>
        <form onSubmit={add} noValidate className="mt-5 flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Navn"
              aria-label="Navn"
              autoComplete="off"
              className={input}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              aria-label="E-mail"
              autoComplete="off"
              inputMode="email"
              className={input}
            />
          </div>

          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Adgang</legend>
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                  role === r.value ? "border-ink bg-white shadow-card" : "border-clay bg-parchment hover:border-ink/40",
                  "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#1B5EAE]/40",
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={() => setRole(r.value)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    role === r.value ? "bg-ink text-white" : "bg-[#F2F5F9] text-stone",
                  )}
                >
                  <RoleIcon>{r.icon}</RoleIcon>
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-[600] text-ink">{r.title}</span>
                  <span className="mt-0.5 block text-[0.85rem] leading-snug text-stone">{r.text}</span>
                </span>
              </label>
            ))}
          </fieldset>

          <button type="submit" disabled={pending} aria-busy={pending} className={`${btnClass("primary")} sm:w-fit`}>
            {pending ? "Et øjeblik..." : "Tilføj og send login"}
          </button>
          {addMsg ? (
            addMsg.ok ? (
              <p role="status" className="flex items-start gap-2.5 rounded-2xl bg-[#E8F0FB] px-4 py-3 text-[0.88rem] leading-snug text-ink">
                <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1B5EAE] text-white" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                </span>
                {addMsg.text}
              </p>
            ) : (
              <p role="alert" className="text-[0.88rem] text-rust">
                {addMsg.text}
              </p>
            )
          ) : null}
        </form>
      </Panel>

      {/* Holdet */}
      <section>
        <h2 className="mb-3 px-1 text-[0.8rem] font-[500] uppercase tracking-[0.14em] text-slate">
          Med login
        </h2>
        <div className={LIST}>
          <ul className="divide-y divide-fog">
            {members.map((m) => {
              const open = openId === m.id;
              const msg = rowMsg?.id === m.id ? rowMsg : null;
              return (
                <li key={m.id} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-[0.95rem] font-[600] text-ink"
                      aria-hidden
                    >
                      {initial(m)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[0.98rem] font-[600] text-ink">{m.name ?? m.email}</span>
                      {m.name ? <span className="block truncate text-[0.85rem] text-stone">{m.email}</span> : null}
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip tone={m.role === "OWNER" ? "blue" : "gray"}>{m.role === "OWNER" ? "Adgang til alt" : "Kun kassen"}</Chip>
                        {m.isYou ? <Chip tone="gray">Dig</Chip> : null}
                        {!m.verified && !m.isYou ? <Chip tone="amber">Inviteret</Chip> : null}
                      </span>
                    </div>
                    {m.isYou ? null : (
                      <button
                        type="button"
                        onClick={() => toggleRow(m.id)}
                        aria-expanded={open}
                        className="shrink-0 rounded-full border border-clay px-3.5 py-1.5 text-[0.85rem] font-[500] text-ink transition-colors hover:border-ink"
                      >
                        {open ? "Luk" : "Ret"}
                      </button>
                    )}
                  </div>

                  {open ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 pl-[3.25rem]">
                      {confirmId === m.id ? (
                        <>
                          <span className="text-[0.88rem] text-stone">Fjern {m.name ?? m.email}?</span>
                          <button type="button" onClick={() => remove(m.id)} disabled={pending} className={cn(textBtn, "text-rust")}>
                            Ja, fjern
                          </button>
                          <button type="button" onClick={() => setConfirmId(null)} disabled={pending} className={textBtn}>
                            Fortryd
                          </button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => resend(m.id)} disabled={pending} className={btnClass("outline")}>
                            Send login igen
                          </button>
                          <button
                            type="button"
                            onClick={() => changeRole(m.id, m.role === "OWNER" ? "STAFF" : "OWNER")}
                            disabled={pending}
                            className={btnClass("outline")}
                          >
                            {m.role === "OWNER" ? "Kun kassen" : "Giv adgang til alt"}
                          </button>
                          <button type="button" onClick={() => setConfirmId(m.id)} className={cn(textBtn, "text-rust")}>
                            Fjern
                          </button>
                        </>
                      )}
                      {msg ? (
                        <p role={msg.ok ? "status" : "alert"} className={cn("w-full text-[0.85rem]", msg.ok ? "text-ink" : "text-rust")}>
                          {msg.text}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Faelles kasse uden login */}
      <section>
        <h2 className="mb-1 px-1 text-[0.8rem] font-[500] uppercase tracking-[0.14em] text-slate">
          Fælles kasse
        </h2>
        <p className="mb-3 px-1 text-[0.88rem] leading-relaxed text-stone">
          Til en iPad eller telefon, der bliver i butikken. Den åbner kun kassen og kræver ikke login.
        </p>
        <div className={LIST}>
          {devices.length > 0 ? (
            <ul className="divide-y divide-fog">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand text-ink" aria-hidden>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-[1.05rem] w-[1.05rem]">
                      <rect x="5" y="2" width="14" height="20" rx="2.5" />
                      <path d="M11 18h2" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.98rem] font-[600] text-ink">{d.name}</p>
                    <p className="text-[0.85rem] text-stone">{lastSeenText(d.lastSeenAt)}</p>
                  </div>
                  {confirmDeviceId === d.id ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" onClick={() => revoke(d.id)} disabled={pending} className={cn(textBtn, "text-rust")}>
                        Ja, fjern
                      </button>
                      <button type="button" onClick={() => setConfirmDeviceId(null)} disabled={pending} className={textBtn}>
                        Fortryd
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmDeviceId(d.id)} className={cn(textBtn, "shrink-0")}>
                      Fjern
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
          <div className={cn("px-5 py-4", devices.length > 0 && "border-t border-fog")}>
            <button type="button" onClick={newCode} disabled={pending} className={btnClass("outline")}>
              Lav et kasse-link
            </button>
          </div>
        </div>
      </section>

      {pairing ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-6" onClick={closePairing}>
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Fælles kasse"
            className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[18px] bg-parchment p-8 text-center"
          >
            <h3 className="text-[1.3rem] font-[600] tracking-[-0.01em] text-ink">Fælles kasse</h3>
            <p className="max-w-xs text-[0.9rem] leading-relaxed text-stone">
              Åbn linket på den iPad eller telefon, der skal være kasse, eller scan QR-koden med den.
            </p>
            <button type="button" onClick={sharePairing} className={`${btnClass("primary")} w-full`}>
              {linkCopied ? "Link kopieret" : "Send linket"}
            </button>
            <div className="rounded-2xl border border-fog bg-white p-3 shadow-card">
              <Image src={pairing.qrDataUrl} alt="QR-kode til kassen" width={200} height={200} className="h-44 w-44" unoptimized />
            </div>
            <p className="text-[0.85rem] leading-relaxed text-slate">
              Eller skriv koden <span className="font-[600] tracking-[0.15em] text-ink">{pairing.code}</span> på{" "}
              <span className="font-[500] text-ink">{APP_HOST}/kasse</span>. Linket og koden virker i 30 minutter.
            </p>
            <button type="button" onClick={closePairing} className={btnClass("outline")}>
              Færdig
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
