"use client";

import { useState, useTransition } from "react";
import { CardDesigner, type CardDesign } from "@/components/CardDesigner";
import { saveCardDesign } from "../actions";
import { btnClass } from "@/components/ui";

export function KortEditor({
  initial,
  businessName,
  showPoweredBy,
}: {
  initial: CardDesign;
  businessName: string;
  showPoweredBy: boolean;
}) {
  const [design, setDesign] = useState<CardDesign>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveCardDesign(design);
      setMsg(res.ok ? "Gemt" : (res.error ?? "Noget gik galt."));
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <CardDesigner
        value={design}
        onChange={setDesign}
        businessName={businessName}
        allowLogo
        showPoweredBy={showPoweredBy}
      />
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={pending} className={btnClass("primary")}>
          {pending ? "Gemmer..." : "Gem kort"}
        </button>
        {msg ? (
          <span className="text-[0.82rem] font-[200] text-moss">{msg}</span>
        ) : null}
      </div>
    </div>
  );
}
