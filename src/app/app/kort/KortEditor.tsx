"use client";

import { useRef, useState, useTransition } from "react";
import { CardDesigner, type CardDesign } from "@/components/CardDesigner";
import { ShareCard } from "@/components/ShareCard";
import { saveCardDesign } from "../actions";
import { btnClass } from "@/components/ui";

export function KortEditor({
  initial,
  businessName,
  slug,
  qrDataUrl,
}: {
  initial: CardDesign;
  businessName: string;
  slug: string;
  qrDataUrl: string;
}) {
  const [design, setDesign] = useState<CardDesign>(initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveCardDesign(design);
      setMsg(res.ok ? "Gemt" : (res.error ?? "Noget gik galt."));
    });
  }

  async function download() {
    const node = shareRef.current;
    if (!node) return;
    setMsg(null);
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      // Kald to gange - foerste gang varmer webfonts/billeder op.
      await toPng(node, { pixelRatio: 2, backgroundColor: "#FAF8F4" });
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#FAF8F4",
      });
      const a = document.createElement("a");
      a.download = `stempelkort-${slug}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error(e);
      setMsg("Kunne ikke lave billedet. Prøv igen.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <CardDesigner
        value={design}
        onChange={setDesign}
        businessName={businessName}
        allowLogo
      />
      <div className="flex flex-wrap items-center gap-4">
        <button onClick={save} disabled={pending} className={btnClass("primary")}>
          {pending ? "Gemmer..." : "Gem kort"}
        </button>
        <button
          onClick={download}
          disabled={downloading}
          className={btnClass("outline")}
        >
          {downloading ? "Laver billede..." : "Download som PNG"}
        </button>
        {msg ? (
          <span className="text-[0.82rem] font-[200] text-moss">{msg}</span>
        ) : null}
      </div>

      {/* Skjult delekort, som eksporteres til PNG (deles paa sociale medier). */}
      <div
        ref={shareRef}
        aria-hidden
        className="pointer-events-none fixed left-[-9999px] top-0"
      >
        <ShareCard
          design={design}
          businessName={businessName}
          qrDataUrl={qrDataUrl}
        />
      </div>
    </div>
  );
}
