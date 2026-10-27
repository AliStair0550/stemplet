"use client";

import { useState } from "react";

// Regneeksemplet fra dokumentet (20 ambassadoerer x 2 venner = 40 nye kunder),
// men med butikkens egne tal. Kun et eksempel; ingen loefter.

const kr = (n: number) => `${new Intl.NumberFormat("da-DK").format(n)} kr.`;

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  format = String,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  format?: (n: number) => string;
  onChange: (n: number) => void;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-[15px]">
        <span className="text-[#6E6E73]">{label}</span>
        <span className="font-semibold tabular-nums">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full cursor-pointer accent-[#1D1D1F]"
      />
    </label>
  );
}

export function Calculator() {
  const [ambassadors, setAmbassadors] = useState(20);
  const [friends, setFriends] = useState(2);
  const [value, setValue] = useState(1500);
  const customers = ambassadors * friends;

  return (
    <div className="mx-auto grid max-w-[880px] items-center gap-10 md:grid-cols-2 md:gap-16">
      <div className="flex flex-col gap-8">
        <Slider label="Ambassadører" value={ambassadors} min={5} max={100} onChange={setAmbassadors} />
        <Slider label="Venner hver om året" value={friends} min={1} max={5} onChange={setFriends} />
        <Slider
          label="En ny kunde er værd"
          value={value}
          min={500}
          max={5000}
          step={100}
          format={kr}
          onChange={setValue}
        />
      </div>
      <div className="text-center md:text-left">
        <p className="text-[72px] font-semibold leading-none tracking-[-0.04em] tabular-nums md:text-[96px]">{customers}</p>
        <p className="mt-2 text-[17px] text-[#6E6E73]">nye kunder om året</p>
        <p className="mt-6 text-[28px] font-semibold tracking-[-0.02em] tabular-nums">{kr(customers * value)}</p>
        <p className="mt-1 text-[15px] text-[#6E6E73]">i ny omsætning</p>
      </div>
    </div>
  );
}
