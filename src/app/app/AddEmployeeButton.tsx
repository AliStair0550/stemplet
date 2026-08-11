"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import { createPairingCodeAction } from "./indstillinger/device-actions";

// "Tilfoej medarbejder" der bliver paa siden: danner en parringskode og viser
// kode + QR i en dialog i stedet for at sende ejeren over i Indstillinger. Kan
// bruges hvor som helst paa dashboardet; forael­deren styrer knappens udseende
// via className.
export function AddEmployeeButton({
  className,
  label = "Tilføj medarbejder",
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const [pairing, setPairing] = useState<{
    code: string;
    qrDataUrl: string;
  } | null>(null);
  const [pending, start] = useTransition();

  function open() {
    start(async () => {
      const res = await createPairingCodeAction();
      setPairing({ code: res.code, qrDataUrl: res.qrDataUrl });
    });
  }

  function close() {
    setPairing(null);
    // Opdatér overblikket, saa enheds-tael og anbefaling afspejler den nye enhed.
    router.refresh();
  }

  useEffect(() => {
    if (!pairing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pairing]);

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={pending}
        className={className ?? `${btnClass("outline")} disabled:opacity-60`}
      >
        {pending ? "Åbner..." : label}
      </button>

      {pairing ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Tilføj en medarbejder"
          onClick={close}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-6 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-fog bg-white p-7 text-center shadow-hero"
          >
            <span className="text-[0.62rem] font-[500] uppercase tracking-[0.16em] text-terracotta">
              Tilføj en medarbejder
            </span>
            <h3 className="mt-1 font-[300] text-[1.3rem] text-ink">
              Par medarbejderens telefon
            </h3>
            <p className="mx-auto mt-2 max-w-xs font-[300] text-[0.85rem] leading-relaxed text-stone">
              Åbn{" "}
              <span className="font-[500] text-ink">stemplet.alius.dk/kasse</span>{" "}
              på deres telefon og indtast koden, eller scan QR-koden.
            </p>
            <p className="my-4 font-fraunces text-[2.2rem] tracking-[0.25em] text-terracotta">
              {pairing.code}
            </p>
            <div className="mx-auto w-fit rounded-xl border border-fog bg-white p-3">
              <Image
                src={pairing.qrDataUrl}
                width={180}
                height={180}
                alt="QR til parring af enhed"
                unoptimized
                className="h-[160px] w-[160px] rounded-[6px]"
              />
            </div>
            <p className="mt-3 font-[300] text-[0.76rem] text-slate">
              Koden virker i 10 minutter. Enheden kan stemple og indløse, men
              aldrig se dine indstillinger.
            </p>
            <button
              type="button"
              autoFocus
              onClick={close}
              className={`${btnClass("primary")} mt-5 w-full`}
            >
              Færdig
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
