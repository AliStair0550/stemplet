"use client";

import { useRef, useState } from "react";
import { StampCard } from "@/components/StampCard";
import { ShareCard } from "@/components/ShareCard";
import { btnClass } from "@/components/ui";
import type { CardDesign } from "@/components/CardDesigner";
import type { StampIconKey } from "@/lib/brand";

// "Del dit kort": kortet som et social-klar billede + native deling, download og
// kopier-link. Kunderne henter kortet foer/ved naeste besoeg.
export function ShareCardSection({
  design,
  businessName,
  slug,
  cardUrl,
  qrDataUrl,
}: {
  design: CardDesign;
  businessName: string;
  slug: string;
  cardUrl: string;
  qrDataUrl: string;
}) {
  const shareRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<
    null | "post" | "card" | "share"
  >(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Renderer en node til en PNG. Venter paa skrifttyper + billeder, ellers
  // bliver billedet tomt (samme moenster som kortdesigneren). backgroundColor
  // udelades for kortet alene, saa de runde hjoerner bliver gennemsigtige.
  async function makePng(
    node: HTMLElement | null,
    backgroundColor?: string,
  ): Promise<string> {
    if (!node) throw new Error("no node");
    const { toPng } = await import("html-to-image");
    if (document.fonts?.ready) await document.fonts.ready;
    await Promise.all(
      Array.from(node.querySelectorAll("img")).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              const done = () => res();
              img.onload = done;
              img.onerror = done;
              setTimeout(done, 1500);
            }),
      ),
    );
    const opts = {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor,
      width: node.offsetWidth,
      height: node.offsetHeight,
    };
    await toPng(node, opts); // foerste kald varmer op
    return toPng(node, opts);
  }

  function saveDataUrl(dataUrl: string, filename: string) {
    const a = document.createElement("a");
    a.download = filename;
    a.href = dataUrl;
    a.click();
  }

  // Kortet alene, med butikkens design og ingen anden tekst.
  async function downloadCard() {
    setMsg(null);
    setBusy("card");
    try {
      const dataUrl = await makePng(cardRef.current);
      saveDataUrl(dataUrl, `stempelkort-${slug}.png`);
    } catch {
      setMsg({ ok: false, text: "Kunne ikke lave billedet. Prøv igen." });
    } finally {
      setBusy(null);
    }
  }

  // Det social-klare opslagsbillede (kort + QR + tekst).
  async function downloadPost() {
    setMsg(null);
    setBusy("post");
    try {
      const dataUrl = await makePng(shareRef.current, "#FAF8F4");
      saveDataUrl(dataUrl, `stempelkort-til-opslag-${slug}.png`);
    } catch {
      setMsg({ ok: false, text: "Kunne ikke lave billedet. Prøv igen." });
    } finally {
      setBusy(null);
    }
  }

  // QR-koden alene som PNG.
  function downloadQr() {
    setMsg(null);
    saveDataUrl(qrDataUrl, `stemplet-qr-${slug}.png`);
  }

  async function share() {
    setMsg(null);
    setBusy("share");
    try {
      const text = `Hent dit digitale stempelkort hos ${businessName}: ${cardUrl}`;
      const dataUrl = await makePng(shareRef.current, "#FAF8F4");
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `stempelkort-${slug}.png`, {
        type: "image/png",
      });
      const nav = navigator as Navigator & {
        canShare?: (d?: unknown) => boolean;
      };
      if (nav.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: `${businessName} stempelkort`, text, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: `${businessName} stempelkort`, text, url: cardUrl });
      } else {
        await navigator.clipboard.writeText(cardUrl);
        setMsg({ ok: true, text: "Deling understøttes ikke her. Link kopieret." });
      }
    } catch {
      // bruger annullerede deling eller ikke understoettet: ingen fejlbesked
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-fog bg-white shadow-card p-6 md:p-8">
      <div className="grid items-center gap-8 md:grid-cols-[minmax(0,18rem)_1fr]">
        {/* Preview af kortet */}
        <div className="mx-auto w-full max-w-xs">
          <StampCard
            businessName={businessName}
            logoUrl={design.logoUrl}
            logoScale={design.logoScale ?? 1}
            primaryColor={design.primaryColor}
            textColor={design.textColor}
            stampIcon={design.stampIcon as StampIconKey}
            stamps={Math.min(3, design.stampsRequired)}
            required={design.stampsRequired}
            rewardText={design.rewardText}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-label font-[400] uppercase tracking-[0.14em] text-terracotta">
              Del dit kort
            </h2>
            <p className="mt-2 max-w-md font-[300] text-[0.9rem] leading-relaxed text-stone">
              Læg kortet på Instagram eller Facebook, så kunderne henter det
              hjem og har det klar i Wallet til næste besøg. Billedet indeholder
              en QR, de bare scanner.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={share}
              disabled={busy !== null}
              className={btnClass("terracotta")}
            >
              {busy === "share" ? "Klargør..." : "Del"}
            </button>
            <a
              href={cardUrl}
              target="_blank"
              rel="noreferrer"
              className={btnClass("outline")}
            >
              Se kort
            </a>
            <button
              onClick={downloadCard}
              disabled={busy !== null}
              className={btnClass("outline")}
            >
              {busy === "card" ? "Laver billede..." : "Download kort"}
            </button>
            <button
              onClick={downloadPost}
              disabled={busy !== null}
              className={btnClass("outline")}
            >
              {busy === "post" ? "Laver billede..." : "Download billede til opslag"}
            </button>
            <button
              onClick={downloadQr}
              disabled={busy !== null}
              className={btnClass("outline")}
            >
              Download QR-kode
            </button>
            {msg ? (
              <span
                className={`text-[0.82rem] font-[300] ${
                  msg.ok ? "text-terracotta" : "text-rust"
                }`}
              >
                {msg.text}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Skjulte capture-noder til PNG (fuld bredde, usynlige via foraelder).
          shareRef = opslagsbilledet; cardRef = kortet alene, uden anden tekst. */}
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
        <div ref={cardRef} className="w-[440px]">
          <StampCard
            businessName={businessName}
            logoUrl={design.logoUrl}
            logoScale={design.logoScale ?? 1}
            primaryColor={design.primaryColor}
            textColor={design.textColor}
            stampIcon={design.stampIcon as StampIconKey}
            stamps={Math.min(3, design.stampsRequired)}
            required={design.stampsRequired}
            rewardText={design.rewardText}
          />
        </div>
      </div>
    </div>
  );
}
