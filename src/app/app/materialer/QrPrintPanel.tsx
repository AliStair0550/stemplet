"use client";

import { useEffect, useState } from "react";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  QR_PRINT_HEADLINE,
  QR_PRINT_HELPER,
  QR_PRINT_BRAND,
  type QrFormat,
  type QrOrient,
  defaultOrient,
} from "@/lib/qr-print";

type Props = {
  slug: string;
  cardUrl: string;
  qrDataUrl: string;
  businessName: string;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
};

// Forhaandsvisning der skalerer rent: artboardet er en container, og alt indeni
// maales i cqw (procent af artboardets bredde), saa kortet ser ens ud i enhver
// stoerrelse. Spejler PDF'ens opbygning (QR som det tydeligste element).
type Layout = {
  ratio: string;
  maxW: number;
  pad: string;
  row: boolean;
  qr: string;
  tilePad: string;
  logoH: string;
  name: string;
  head: string;
  help: string;
  brand: string;
};

const LAYOUT: Record<string, Layout> = {
  "visitkort-landscape": {
    ratio: "85 / 55", maxW: 360, pad: "7cqw", row: true, qr: "34cqw",
    tilePad: "2.6cqw", logoH: "10cqw", name: "4cqw", head: "5.2cqw", help: "3.4cqw", brand: "2.9cqw",
  },
  "visitkort-portrait": {
    ratio: "55 / 85", maxW: 230, pad: "8cqw", row: false, qr: "46cqw",
    tilePad: "3cqw", logoH: "12cqw", name: "5.5cqw", head: "7cqw", help: "4.6cqw", brand: "3.8cqw",
  },
  "a4-portrait": {
    ratio: "210 / 297", maxW: 300, pad: "9cqw", row: false, qr: "56cqw",
    tilePad: "3.5cqw", logoH: "13cqw", name: "5cqw", head: "8cqw", help: "4.6cqw", brand: "3.4cqw",
  },
  "a4-landscape": {
    ratio: "297 / 210", maxW: 400, pad: "7cqw", row: true, qr: "44cqw",
    tilePad: "3cqw", logoH: "9cqw", name: "3.6cqw", head: "5cqw", help: "3cqw", brand: "2.4cqw",
  },
};

function Preview({
  format,
  orient,
  qrDataUrl,
  logoUrl,
  businessName,
  primaryColor,
  textColor,
}: {
  format: QrFormat;
  orient: QrOrient;
  qrDataUrl: string;
  logoUrl: string | null;
  businessName: string;
  primaryColor: string;
  textColor: string;
}) {
  const l = LAYOUT[`${format}-${orient}`];
  const tile = (
    <div
      style={{
        background: "#fff",
        borderRadius: "3cqw",
        padding: l.tilePad,
        lineHeight: 0,
        flexShrink: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={qrDataUrl}
        alt="Forhåndsvisning af QR-kode"
        style={{ display: "block", width: l.qr, height: l.qr }}
      />
    </div>
  );
  const brandmark = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      style={{ height: l.logoH, maxWidth: "70%", objectFit: "contain" }}
    />
  ) : (
    <span
      style={{
        fontSize: l.name,
        fontWeight: 700,
        lineHeight: 1.1,
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {businessName}
    </span>
  );
  const textBlock = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.6cqw",
        alignItems: l.row ? "flex-start" : "center",
        textAlign: l.row ? "left" : "center",
        marginLeft: l.row ? "5cqw" : 0,
        marginTop: l.row ? 0 : "4cqw",
        minWidth: 0,
      }}
    >
      {brandmark}
      <span style={{ fontSize: l.head, fontWeight: 700, lineHeight: 1.14 }}>
        {QR_PRINT_HEADLINE}
      </span>
      <span style={{ fontSize: l.help, opacity: 0.82, lineHeight: 1.2 }}>
        {QR_PRINT_HELPER}
      </span>
      <span style={{ fontSize: l.brand, opacity: 0.6, marginTop: "1cqw" }}>
        {QR_PRINT_BRAND}
      </span>
    </div>
  );

  return (
    <div className="flex w-full justify-center">
      <div
        aria-hidden
        style={{
          containerType: "inline-size",
          width: "100%",
          maxWidth: l.maxW,
          aspectRatio: l.ratio,
          background: primaryColor,
          color: textColor,
          borderRadius: 10,
          overflow: "hidden",
          boxShadow:
            "0 20px 40px -18px rgba(28,25,23,0.35), 0 2px 6px rgba(28,25,23,0.08)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            padding: l.pad,
            display: "flex",
            flexDirection: l.row ? "row" : "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {tile}
          {textBlock}
        </div>
      </div>
    </div>
  );
}

export function QrPrintPanel({
  slug,
  cardUrl,
  qrDataUrl,
  businessName,
  primaryColor,
  textColor,
  logoUrl,
}: Props) {
  const [format, setFormat] = useState<QrFormat>("visitkort");
  const [orient, setOrient] = useState<QrOrient>("landscape");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"idle" | "done" | "error">("idle");

  useEffect(() => {
    setPhase("idle");
  }, [format, orient]);

  function chooseFormat(f: QrFormat) {
    setFormat(f);
    setOrient(defaultOrient(f));
  }

  function buildUrl(inline?: boolean): string {
    const p = new URLSearchParams({ slug, orient });
    if (inline) p.set("disp", "inline");
    return `/api/qr-print/${format}?${p.toString()}`;
  }

  async function download() {
    setBusy(true);
    setPhase("idle");
    try {
      const res = await fetch(buildUrl());
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `stemplet-${slug}-${format === "a4" ? "a4" : "visitkort"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 15000);
      setPhase("done");
    } catch {
      setPhase("error");
    } finally {
      setBusy(false);
    }
  }

  const FORMATS: { key: QrFormat; title: string; note: string }[] = [
    { key: "visitkort", title: "Visitkort", note: "85 × 55 mm, til disk og hånd" },
    { key: "a4", title: "A4-plakat", note: "Til vindue, væg eller ved kassen" },
  ];

  return (
    <div className="rounded-lg border border-fog bg-white p-6 shadow-card md:p-8">
      <p className="max-w-xl font-[300] text-[0.9rem] leading-relaxed text-stone">
        En færdig QR-kode i dit design, klar til print. Kunderne scanner den med
        kameraet og henter kortet med det samme.
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_minmax(0,20rem)] md:items-start">
        {/* Venstre: valg + handlinger */}
        <div className="order-2 flex flex-col gap-5 md:order-1">
          <div className="grid grid-cols-2 gap-2">
            {FORMATS.map((f) => {
              const active = format === f.key;
              return (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => chooseFormat(f.key)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    active
                      ? "border-terracotta bg-terracotta/[0.06]"
                      : "border-fog bg-white hover:border-clay",
                  )}
                >
                  <span className="block font-[400] text-[0.92rem] text-ink">
                    {f.title}
                  </span>
                  <span className="mt-0.5 block font-[300] text-[0.74rem] leading-snug text-stone">
                    {f.note}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[0.66rem] font-[400] uppercase tracking-[0.1em] text-slate">
              Retning
            </span>
            <div className="inline-flex w-fit rounded-full border border-clay p-0.5">
              {[
                { v: "landscape" as const, label: "Liggende" },
                { v: "portrait" as const, label: "Stående" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setOrient(o.v)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[0.82rem] transition-colors",
                    orient === o.v
                      ? "bg-terracotta text-parchment"
                      : "text-stone hover:text-ink",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <p className="font-[300] text-[0.78rem] leading-relaxed text-slate">
            Tjek at koden virker: scan forhåndsvisningen med kameraet, eller{" "}
            <a
              href={cardUrl}
              target="_blank"
              rel="noreferrer"
              className="text-terracotta underline underline-offset-2 hover:opacity-70"
            >
              åbn kundens side
            </a>
            .
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={download}
              disabled={busy}
              className={cn(btnClass("primary", "lg"), "w-full disabled:opacity-60")}
            >
              {busy ? "Laver PDF..." : "Hent og print QR-kode"}
            </button>
            <button
              type="button"
              onClick={() => window.open(buildUrl(true), "_blank", "noopener")}
              className={cn(btnClass("outline"), "w-full")}
            >
              Print
            </button>
          </div>

          <div aria-live="polite" className="min-h-[1.25rem]">
            {phase === "done" ? (
              <p className="font-[300] text-[0.82rem] leading-relaxed text-terracotta">
                QR-koden er klar. Placér den ved kassen, og invitér din første
                kunde til at scanne den.
              </p>
            ) : phase === "error" ? (
              <p className="font-[300] text-[0.82rem] leading-relaxed text-rust">
                Vi kunne ikke lave PDF&apos;en lige nu. Prøv igen om lidt.
              </p>
            ) : null}
          </div>

          <p className="font-[300] text-[0.72rem] leading-relaxed text-slate">
            {format === "visitkort"
              ? "Visitkortet leveres med 3 mm beskæring og skæremærker, klar til tryk."
              : "Plakaten er i fuld A4 og kan scannes på afstand."}
          </p>
        </div>

        {/* Højre: forhaandsvisning */}
        <div className="order-1 md:order-2">
          <Preview
            format={format}
            orient={orient}
            qrDataUrl={qrDataUrl}
            logoUrl={logoUrl}
            businessName={businessName}
            primaryColor={primaryColor}
            textColor={textColor}
          />
        </div>
      </div>
    </div>
  );
}
