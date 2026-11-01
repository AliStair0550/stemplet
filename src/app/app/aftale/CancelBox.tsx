"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import { setCancelled } from "./actions";

// Opsig abonnementet: to trin (spoerg, saa bekraeft), og en tydelig kvittering
// med sidste dag. Kan fortrydes, indtil kortet lukker.
export function CancelBox({ cancelled, lastDay }: { cancelled: boolean; lastDay: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();

  const run = (cancel: boolean) =>
    start(async () => {
      await setCancelled(cancel);
      setAsking(false);
      router.refresh();
    });

  if (cancelled) {
    return (
      <div className="flex flex-col gap-4">
        <div role="status" className="rounded-lg border border-fog bg-[#F2F5F9] px-5 py-4">
          <p className="font-[400] text-[0.95rem] text-ink">Abonnementet er opsagt</p>
          <p className="mt-1 font-[300] text-[0.85rem] leading-relaxed text-stone">
            Dit kort kører til og med {lastDay}. Derefter lukker vi det. Vi har fået besked.
          </p>
        </div>
        <button type="button" onClick={() => run(false)} disabled={pending} className={`${btnClass("outline")} self-start`}>
          {pending ? "Et øjeblik..." : "Fortryd opsigelsen"}
        </button>
      </div>
    );
  }

  if (asking) {
    return (
      <div className="flex flex-col gap-4">
        <p className="font-[300] text-[0.9rem] leading-relaxed text-stone">
          Dit kort kører til og med {lastDay}. Derefter lukker vi det, og kunderne kan ikke længere bruge det.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => run(true)} disabled={pending} className={`${btnClass("outline")} !border-rust !text-rust`}>
            {pending ? "Opsiger..." : "Ja, opsig"}
          </button>
          <button type="button" onClick={() => setAsking(false)} disabled={pending} className={btnClass("outline")}>
            Fortryd
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-[300] text-[0.9rem] leading-relaxed text-stone">Ingen binding. Du kan opsige når som helst.</p>
      <button type="button" onClick={() => setAsking(true)} className={`${btnClass("outline")} self-start`}>
        Opsig abonnementet
      </button>
    </div>
  );
}
