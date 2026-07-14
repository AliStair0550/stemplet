"use client";

// Ren klient-komponent: opdaterer oejeblikkeligt, ingen animation (og dermed
// intet at respektere for prefers-reduced-motion).
import { useState } from "react";
import { Section, Eyebrow } from "@/components/ui";
import { formatDkNumber } from "@/lib/utils";

function Slider({
  label,
  value,
  min,
  max,
  step,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-[0.9rem] font-[300] leading-snug text-stone">
          {label}
        </span>
        <span className="shrink-0 font-[400] text-[1.05rem] tabular-nums text-ink">
          {formatDkNumber(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full cursor-pointer accent-moss"
      />
    </div>
  );
}

export default function RoiCalculator() {
  const [purchase, setPurchase] = useState(45);
  const [visits, setVisits] = useState(4);
  const [extra, setExtra] = useState(5);

  const perCustomerYear = purchase * visits * 12;
  const total = perCustomerYear * extra;

  return (
    <Section id="vaerd">
      <div className="max-w-xl">
        <Eyebrow>Regn på det</Eyebrow>
        <h2 className="mt-4 font-[300] text-[2rem] leading-[1.3] tracking-[0.03em] text-ink">
          Hvad er én stamkunde værd?
        </h2>
        <p className="mt-5 max-w-md font-[200] text-[0.95rem] leading-[1.8] text-stone">
          Træk i knapperne og se, hvad et par flere faste kunder betyder på et
          år.
        </p>
      </div>

      <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-7">
          <Slider
            label="Gennemsnitligt køb"
            value={purchase}
            min={20}
            max={500}
            step={5}
            suffix=" kr."
            onChange={setPurchase}
          />
          <Slider
            label="Besøg om måneden (pr. stamkunde)"
            value={visits}
            min={1}
            max={20}
            step={1}
            onChange={setVisits}
          />
          <Slider
            label="Hvor mange flere stamkunder tror du på?"
            value={extra}
            min={1}
            max={50}
            step={1}
            onChange={setExtra}
          />
        </div>

        <div className="flex flex-col justify-center gap-3 rounded-lg border border-moss bg-moss/[0.04] p-8 md:p-10">
          <span className="text-[0.62rem] font-[500] uppercase tracking-[0.14em] text-[#B0893A]">
            Ekstra omsætning
          </span>
          <p className="font-[300] leading-none text-ink">
            <span className="text-[2.6rem] tabular-nums">
              {formatDkNumber(total)} kr.
            </span>
            <span className="ml-1 text-[1rem] font-[200] text-slate">
              mere om året
            </span>
          </p>
        </div>
      </div>
    </Section>
  );
}
