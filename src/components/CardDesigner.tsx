"use client";

import { useState } from "react";
import { StampCard } from "./StampCard";
import { StampIcon } from "./StampIcon";
import { STAMP_ICONS, contrastText, normalizeHex, type StampIconKey } from "@/lib/brand";
import { uploadLogoAction } from "@/app/actions/logo";
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

/** Uddrag dominerende farve fra et logo (klient-side, ingen server). */
function dominantColor(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const size = 48;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        return reject(new Error("canvas"));
      }
      ctx.drawImage(img, 0, 0, size, size);
      const { data } = ctx.getImageData(0, 0, size, size);
      let r = 0,
        g = 0,
        b = 0,
        count = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 128) continue;
        const rr = data[i],
          gg = data[i + 1],
          bb = data[i + 2];
        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        const sat = max === 0 ? 0 : (max - min) / max;
        const weight = sat * sat + 0.08;
        r += rr * weight;
        g += gg * weight;
        b += bb * weight;
        count += weight;
      }
      URL.revokeObjectURL(url);
      if (count === 0) return resolve("#061C3D");
      const hex =
        "#" +
        [r, g, b]
          .map((v) => Math.round(v / count).toString(16).padStart(2, "0"))
          .join("");
      resolve(hex.toUpperCase());
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
    // Auto-forslag til farve fra logoet.
    try {
      const color = await dominantColor(file);
      onChange({
        ...value,
        primaryColor: color,
        textColor: contrastText(color),
      });
    } catch {
      // ignorer - beholder valgte farver
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    const res = await uploadLogoAction(fd);
    setUploading(false);
    if (res.error) setLogoError(res.error);
    else if (res.url) set("logoUrl", res.url);
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
            className="border border-clay bg-parchment px-4 py-2.5 font-[200] text-[0.95rem] text-ink outline-none focus:border-moss"
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
                className="w-full border border-clay bg-parchment px-3 py-2 font-[200] text-[0.85rem] text-ink outline-none focus:border-moss"
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
                className="w-full border border-clay bg-parchment px-3 py-2 font-[200] text-[0.85rem] text-ink outline-none focus:border-moss"
              />
            </div>
          </Field>
        </div>

        {allowLogo ? (
          <div className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Logo
            </span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer border border-clay px-4 py-2 text-[0.78rem] font-[300] uppercase tracking-[0.08em] text-ink hover:border-moss hover:text-moss">
                {uploading ? "Uploader..." : "Vælg fil"}
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
                  className="text-[0.75rem] font-[200] text-slate hover:text-ink"
                >
                  Fjern
                </button>
              ) : null}
            </div>
            <p className="text-[0.72rem] font-[200] text-slate">
              Vi henter automatisk et farveforslag fra dit logo.
            </p>
            {logoError ? (
              <p className="text-[0.75rem] font-[200] text-moss">{logoError}</p>
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
        />
      </div>
    </div>
  );
}
