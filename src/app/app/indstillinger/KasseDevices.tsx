"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import {
  createPairingCodeAction,
  revokeDeviceAction,
} from "./device-actions";

type Device = {
  id: string;
  name: string;
  lastSeenAt: string | null;
  createdAt: string;
};

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

export function KasseDevices({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [pairing, setPairing] = useState<{
    code: string;
    qrDataUrl: string;
  } | null>(null);
  const [pending, start] = useTransition();

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
    start(async () => {
      await revokeDeviceAction(id);
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-fog bg-white p-6 md:p-8">
      <div className="flex flex-col gap-1">
        <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-moss">
          Kasse-enheder
        </span>
        <h2 className="font-[300] text-[1.3rem] text-ink">
          Giv personalet adgang uden dit login
        </h2>
        <p className="mt-1 max-w-xl font-[300] text-[0.88rem] leading-relaxed text-stone">
          Par en iPad eller telefon som fast kasse. Den kan vise QR, scanne kort
          og stemple, men aldrig se dine indstillinger, priser eller kunder. Du
          kan spærre en enhed når som helst.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {devices.length === 0 ? (
          <p className="rounded-lg border border-dashed border-clay px-4 py-6 text-center font-[300] text-[0.86rem] text-slate">
            Ingen enheder parret endnu.
          </p>
        ) : (
          devices.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-fog px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-moss/10 text-moss">
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
              <button
                onClick={() => revoke(d.id)}
                disabled={pending}
                className="shrink-0 text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-slate transition-colors hover:text-rust disabled:opacity-50"
              >
                Spær
              </button>
            </div>
          ))
        )}
      </div>

      <button
        onClick={newCode}
        disabled={pending}
        className={`${btnClass("primary")} mt-5`}
      >
        {pending ? "Et øjeblik..." : "Par en ny enhed"}
      </button>

      {pairing ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-6"
          onClick={closePairing}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col items-center gap-5 rounded-lg bg-parchment p-8 text-center"
          >
            <h3 className="font-[300] text-[1.3rem] text-ink">
              Par en ny enhed
            </h3>
            <p className="max-w-xs font-[300] text-[0.86rem] leading-relaxed text-stone">
              På enheden: åbn{" "}
              <span className="font-[400] text-ink">stemplet.alius.dk/kasse</span>{" "}
              og indtast koden, eller scan QR-koden.
            </p>
            <div className="rounded-lg border border-fog bg-white p-3">
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
