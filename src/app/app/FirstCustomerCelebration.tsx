"use client";

import { useEffect, useState } from "react";
import { Confetti } from "@/components/Celebrate";

// Fejrer den foerste kunde paa kortet. Banneret staar, til der er et par kunder;
// konfettien kommer kun een gang pr. butik (husket i browseren).
export function FirstCustomerCelebration({ businessId, customers }: { businessId: string; customers: number }) {
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const key = `folka_first_customer_${businessId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return;
    }
    setBurst(true);
  }, [businessId]);

  return (
    <section className="mb-10 flex items-center gap-4 rounded-[22px] bg-[#061C3D] p-6 text-white md:p-7">
      {burst ? <Confetti colors={["#FFFFFF", "#7CC4FF", "#1B5EAE", "#C8D8E8"]} /> : null}
      <span aria-hidden className="text-[2.4rem] font-bold leading-none tabular-nums tracking-[-0.04em] text-[#7CC4FF]">
        {customers}
      </span>
      <div>
        <h2 className="text-[1.2rem] font-semibold tracking-[-0.02em]">
          {customers === 1 ? "Din første kunde er på kortet." : `${customers} kunder er på kortet.`}
        </h2>
        <p className="mt-0.5 text-[0.9rem] text-white/70">Hver ny kunde lander her. Næste mål: 10.</p>
      </div>
    </section>
  );
}
