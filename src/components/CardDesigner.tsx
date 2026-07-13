"use client";

import { useState } from "react";
import { StampCard } from "./StampCard";
import { StampIcon } from "./StampIcon";
import {
  STAMP_ICONS,
  CARD_THEMES,
  contrastText,
  isCardReadable,
  normalizeHex,
  type StampIconKey,
} from "@/lib/brand";
import { cn } from "@/lib/utils";

export type CardDesign = {
  stampsRequired: number;
  rewardText: string;
  stampIcon: StampIconKey;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
};

export const DEFAULT_DESIGN: CardDesign = {
  stampsRequired: 10,
  rewardText: "10. kop er gratis",
  stampIcon: "coffee",
  primaryColor: "#1F3A2E",
  textColor: "#FFFFFF",
  logoUrl: null,
};

/**
 * Læser logoet én gang i browseren: skalerer det ned og giver både en
 * komprimeret data-URL (gemmes direkte, ingen ekstern tjeneste) og et
 * dominerende farveforslag.
 */
function processLogo(
  file: File,
  maxDim = 240,
): Promise<{ dataUrl: string; color: string | null }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxDim) * scale));
        const h = Math.max(1, Math.round((img.height || maxDim) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(img, 0, 0, w, h);

        const { data } = ctx.getImageData(0, 0, w, h);
        let r = 0,
          g = 0,
          b = 0,
          count = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] < 128) continue;
          const rr = data[i],
            gg = data[i + 1],
            bb = data[i + 2];
          const mx = Math.max(rr, gg, bb);
          const mn = Math.min(rr, gg, bb);
          const sat = mx === 0 ? 0 : (mx - mn) / mx;
          const weight = sat * sat + 0.08;
          r += rr * weight;
          g += gg * weight;
          b += bb * weight;
          count += weight;
        }
        const color =
          count === 0
            ? null
            : (
                "#" +
                [r, g, b]
                  .map((v) =>
                    Math.round(v / count).toString(16).padStart(2, "0"),
                  )
                  .join("")
              ).toUpperCase();

        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve({ dataUrl, color });
      } catch (e) {
        URL.revokeObjectURL(url);
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("load"));
    };
    img.src = url;
  });
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
        {label}
      </span>
      {children}
    </label>
  );
}

export function CardDesigner({
  value,
  onChange,
  businessName,
  allowLogo = false,
  showPoweredBy = false,
}: {
  value: CardDesign;
  onChange: (next: CardDesign) => void;
  businessName: string;
  allowLogo?: boolean;
  showPoweredBy?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  function set<K extends keyof CardDesign>(key: K, val: CardDesign[K]) {
    onChange({ ...value, [key]: val });
  }

  async function handleLogo(file: File) {
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Vælg en billedfil (PNG, JPG eller SVG).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setLogoError("Filen er for stor. Vælg en under 8 MB.");
      return;
    }
    setUploading(true);
    try {
      const { dataUrl, color } = await processLogo(file);
      onChange({
        ...value,
        logoUrl: dataUrl,
        ...(color ? { primaryColor: color, textColor: contrastText(color) } : {}),
      });
    } catch {
      setLogoError("Kunne ikke læse billedet. Prøv et andet.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_minmax(0,20rem)]">
      {/* Formular */}
      <div className="flex flex-col gap-6">
        <Field label={`Antal stempler (${value.stampsRequired})`}>
          <input
            type="range"
            min={4}
            max={12}
            value={value.stampsRequired}
            onChange={(e) => set("stampsRequired", Number(e.target.value))}
            className="accent-moss"
          />
        </Field>

        <Field label="Belønningstekst">
          <input
            type="text"
            value={value.rewardText}
            maxLength={80}
            onChange={(e) => set("rewardText", e.target.value)}
            placeholder="10. kop er gratis"
            className="border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.95rem] text-ink outline-none focus:border-moss"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Stempel-ikon
          </span>
          <div className="flex flex-wrap gap-2">
            {STAMP_ICONS.map((icon) => (
              <button
                key={icon.key}
                type="button"
                onClick={() => set("stampIcon", icon.key)}
                aria-label={icon.label}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-md border transition-colors",
                  value.stampIcon === icon.key
                    ? "border-moss bg-moss/10 text-moss"
                    : "border-clay text-stone hover:border-moss",
                )}
              >
                <StampIcon icon={icon.key} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Farvetema
          </span>
          <div className="flex flex-wrap gap-2.5">
            {CARD_THEMES.map((t) => {
              const active =
                value.primaryColor === t.primary && value.textColor === t.text;
              return (
                <button
                  key={t.name}
                  type="button"
                  title={t.name}
                  aria-label={t.name}
                  onClick={() =>
                    onChange({
                      ...value,
                      primaryColor: t.primary,
                      textColor: t.text,
                    })
                  }
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full transition",
                    active
                      ? "ring-2 ring-moss ring-offset-2 ring-offset-parchment"
                      : "ring-1 ring-clay hover:ring-moss",
                  )}
                  style={{ background: t.primary }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: t.text }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Kortfarve">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.primaryColor}
                onChange={(e) =>
                  set("primaryColor", e.target.value.toUpperCase())
                }
                className="h-10 w-12 cursor-pointer rounded border border-clay bg-transparent"
              />
              <input
                type="text"
                value={value.primaryColor}
                onChange={(e) =>
                  set("primaryColor", normalizeHex(e.target.value, value.primaryColor))
                }
                className="w-full border border-clay bg-parchment px-3 py-2 font-[300] text-[0.85rem] text-ink outline-none focus:border-moss"
              />
            </div>
          </Field>
          <Field label="Tekstfarve">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value.textColor}
                onChange={(e) => set("textColor", e.target.value.toUpperCase())}
                className="h-10 w-12 cursor-pointer rounded border border-clay bg-transparent"
              />
              <input
                type="text"
                value={value.textColor}
                onChange={(e) =>
                  set("textColor", normalizeHex(e.target.value, value.textColor))
                }
                className="w-full border border-clay bg-parchment px-3 py-2 font-[300] text-[0.85rem] text-ink outline-none focus:border-moss"
              />
            </div>
          </Field>
        </div>

        {!isCardReadable(value.primaryColor, value.textColor) ? (
          <div className="-mt-2 flex items-start justify-between gap-3 rounded-lg border border-rust/40 bg-rust/5 px-3 py-2.5">
            <p className="text-[0.76rem] font-[300] leading-relaxed text-rust">
              Teksten er svær at læse på denne kortfarve. Vælg mere kontrast, så
              kunderne kan se deres stempler.
            </p>
            <button
              type="button"
              onClick={() => set("textColor", contrastText(value.primaryColor))}
              className="shrink-0 self-center text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-moss hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/60"
            >
              Ret automatisk
            </button>
          </div>
        ) : null}

        {allowLogo ? (
          <div className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Logo
            </span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer border border-clay px-4 py-2 text-[0.78rem] font-[300] uppercase tracking-[0.08em] text-ink hover:border-moss hover:text-moss">
                {uploading ? "Behandler..." : "Vælg fil"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogo(f);
                  }}
                />
              </label>
              {value.logoUrl ? (
                <button
                  type="button"
                  onClick={() => set("logoUrl", null)}
                  className="text-[0.75rem] font-[300] text-slate hover:text-ink"
                >
                  Fjern
                </button>
              ) : null}
            </div>
            <p className="text-[0.72rem] font-[300] text-slate">
              Vi henter automatisk et farveforslag fra dit logo.
            </p>
            {logoError ? (
              <p className="text-[0.75rem] font-[300] text-rust">{logoError}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Live preview */}
      <div className="md:sticky md:top-6 md:self-start">
        <p className="mb-3 text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
          Sådan ser kortet ud
        </p>
        <StampCard
          businessName={businessName}
          logoUrl={value.logoUrl}
          primaryColor={value.primaryColor}
          textColor={value.textColor}
          stampIcon={value.stampIcon}
          stamps={Math.min(3, value.stampsRequired)}
          required={value.stampsRequired}
          rewardText={value.rewardText}
          showPoweredBy={showPoweredBy}
          serial="STEMPLET01"
          serialLabel={businessName}
        />
      </div>
    </div>
  );
}
