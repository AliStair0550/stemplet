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
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveCardDesign(design);
      setMsg(
        res.ok
          ? { ok: true, text: "Gemt" }
          : { ok: false, text: res.error ?? "Noget gik galt." },
      );
    });
  }

  async function download() {
    const node = shareRef.current;
    if (!node) return;
    setMsg(null);
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");

      // Vent paa skrifttyper OG at alle billeder er faerdigindlaest, ellers
      // bliver PNG'en tom. (Kortet renderes i viewporten men usynligt, saa
      // billederne rent faktisk hentes.)
      if (document.fonts?.ready) await document.fonts.ready;
      await Promise.all(
        Array.from(node.querySelectorAll("img")).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                const done = () => res();
                img.onload = done;
                img.onerror = done;
                // Sikkerheds-timeout: haeng aldrig hvis et billede ikke svarer.
                setTimeout(done, 1500);
              }),
        ),
      );

      const opts = {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#FAF8F4",
        width: node.offsetWidth,
        height: node.offsetHeight,
      };
      // Kald to gange - foerste gang varmer rendering/fonts helt op.
      await toPng(node, opts);
      const dataUrl = await toPng(node, opts);

      const a = document.createElement("a");
      a.download = `stempelkort-${slug}.png`;
      a.href = dataUrl;
      a.click();
    } catch (e) {
      console.error(e);
      setMsg({ ok: false, text: "Kunne ikke lave billedet. Prøv igen." });
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
        <CardDesigner
          value={design}
          onChange={setDesign}
          businessName={businessName}
          allowLogo
        />
        <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-fog pt-6">
          <button
            onClick={save}
            disabled={pending}
            className={btnClass("primary")}
          >
            {pending ? "Gemmer..." : "Gem kort"}
          </button>
          <button
            onClick={download}
            disabled={downloading}
            className={btnClass("outline")}
          >
            {downloading ? "Laver billede..." : "Download som billede"}
          </button>
          {msg ? (
            <span
              className={`text-[0.82rem] font-[300] ${
                msg.ok ? "text-moss" : "text-rust"
              }`}
            >
              {msg.text}
            </span>
          ) : null}
        </div>
      </div>

      {/* Delekort, som eksporteres til PNG. Ligger oeverst i viewporten (saa
          billederne hentes) men usynligt via opacity-0 paa FORAELDEREN, saa
          selve capture-noden (ref) har fuld 560px bredde til html-to-image.
          Vandret scroll fra de 560px undgaas via overflow-x: clip paa body. */}
      <div
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 -z-50 opacity-0"
      >
        <div ref={shareRef} className="w-[560px]">
          <ShareCard
            design={design}
            businessName={businessName}
            qrDataUrl={qrDataUrl}
          />
        </div>
      </div>
    </div>
  );
}
