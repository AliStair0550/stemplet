"use client";

import { useState } from "react";
import { StampCard } from "./StampCard";
import { StampIcon } from "./StampIcon";
import {
  STAMP_ICONS,
  CARD_THEMES,
  themeNameFor,
  contrastText,
  isCardReadable,
  normalizeHex,
  type StampIconKey,
} from "@/lib/brand";
import { REWARD_TEXT_MAX, TERMS_MAX } from "@/lib/system-config";
import { cn } from "@/lib/utils";

export type CardDesign = {
  stampsRequired: number;
  rewardText: string;
  stampIcon: StampIconKey;
  primaryColor: string;
  textColor: string;
  logoUrl: string | null;
  // Navn vist paa kundens kort. Tomt = brug firmanavnet. Valgfrit, saa
  // preview-byggere (kasse, kampagner) ikke behoever saette det.
  displayName?: string | null;
  // Valgfri betingelser. Vises IKKE paa kortet, men under "Hent mit
  // stempelkort" for kunden. Valgfrit felt, saa preview-byggere (kasse,
  // kampagner) ikke behoever saette det.
  terms?: string | null;
};

export const DEFAULT_DESIGN: CardDesign = {
  stampsRequired: 10,
  rewardText: "10. kop er gratis",
  stampIcon: "coffee",
  displayName: null,
  // Espresso: det foerste indbyggede tema, varmt og laesbart for de fleste.
  primaryColor: "#2A1A10",
  textColor: "#F6EEE4",
  logoUrl: null,
  terms: null,
};

// Lille til/fra-kontakt (switch) i brandets stil.
function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment",
        checked ? "bg-terracotta" : "bg-clay",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[1.375rem]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

// Hurtige forslag til belOnningen, saa man kan komme i gang med eet klik.
// BelOnningen er fri tekst, saa fx procent-rabat ("25 % rabat") virker ogsaa.
const REWARD_SUGGESTIONS = [
  "Den 10. er gratis",
  "25 % rabat",
  "Gratis produkt",
  "En på huset",
];

/**
 * Læser logoet én gang i browseren: skalerer det ned til en komprimeret
 * data-URL (gemmes direkte, ingen ekstern tjeneste). Farverne vaelger butikken
 * selv, saa logoet aendrer aldrig kortets farver.
 */
function processLogo(
  file: File,
  // 512 px, saa logoet ogsaa staar knivskarpt i Apple Wallet (op til 480 px
  // paa @3x-skaerme). Skaleres altid ned til visning, aldrig op.
  maxDim = 512,
): Promise<string> {
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
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas");
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/png");
        URL.revokeObjectURL(url);
        resolve(dataUrl);
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
  hidePreview = false,
}: {
  value: CardDesign;
  onChange: (next: CardDesign) => void;
  businessName: string;
  allowLogo?: boolean;
  showPoweredBy?: boolean;
  // Skjul CardDesigners eget preview (fx naar forlaelderen viser eet vedvarende
  // preview ved siden af). Saa staar der kun kontrollerne.
  hidePreview?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  // Betingelser: til/fra + en kladde, saa teksten ikke tabes, hvis man slaar
  // fra og til igen i samme session. Gemt vaerdi er null, naar der er slaaet fra.
  const [termsOn, setTermsOn] = useState<boolean>(!!value.terms);
  const [termsDraft, setTermsDraft] = useState<string>(value.terms ?? "");

  function set<K extends keyof CardDesign>(key: K, val: CardDesign[K]) {
    onChange({ ...value, [key]: val });
  }

  // Navnet paa det aktive tema, eller null hvis kunden har valgt sin egen farve.
  const activeThemeName = themeNameFor(value.primaryColor, value.textColor);

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
      const dataUrl = await processLogo(file);
      onChange({ ...value, logoUrl: dataUrl });
    } catch {
      setLogoError("Kunne ikke læse billedet. Prøv et andet.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className={
        hidePreview
          ? "flex"
          : "grid gap-8 md:grid-cols-[1fr_minmax(0,20rem)] md:gap-12"
      }
    >
      {/* Formular. Paa mobil ligger den UNDER preview'et (order), saa man ser
          kortet, mens man designer. Paa desktop staar den til venstre som foer. */}
      <div
        className={
          hidePreview
            ? "flex w-full flex-col gap-6"
            : "order-2 flex flex-col gap-6 md:order-none"
        }
      >
        <Field label={`Antal stempler (${value.stampsRequired})`}>
          <input
            type="range"
            min={4}
            max={12}
            value={value.stampsRequired}
            onChange={(e) => set("stampsRequired", Number(e.target.value))}
            className="accent-terracotta"
          />
        </Field>

        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
                Belønningstekst
              </span>
              <span
                className={cn(
                  "text-[0.68rem] tabular-nums",
                  value.rewardText.length >= REWARD_TEXT_MAX
                    ? "text-terracotta"
                    : "text-slate",
                )}
              >
                {value.rewardText.length} / {REWARD_TEXT_MAX}
              </span>
            </span>
            <input
              type="text"
              value={value.rewardText}
              maxLength={REWARD_TEXT_MAX}
              onChange={(e) => set("rewardText", e.target.value)}
              placeholder="10. kop er gratis"
              className="border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.95rem] text-ink outline-none focus:border-terracotta"
            />
          </label>
          <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
            Kort tekst ser bedst ud i Apple Wallet. Maks {REWARD_TEXT_MAX} tegn.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REWARD_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("rewardText", s)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[0.72rem] font-[300] transition-colors",
                  value.rewardText === s
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-clay text-stone hover:border-terracotta hover:text-terracotta",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
                    ? "border-terracotta bg-terracotta/10 text-terracotta"
                    : "border-clay text-stone hover:border-terracotta",
                )}
              >
                <StampIcon icon={icon.key} className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Tema
            </span>
            <span className="text-[0.72rem] font-[300] text-slate">
              {activeThemeName ?? "Egen farve"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CARD_THEMES.map((t) => {
              const active =
                value.primaryColor.toUpperCase() === t.primary.toUpperCase() &&
                value.textColor.toUpperCase() === t.text.toUpperCase();
              return (
                <button
                  key={t.name}
                  type="button"
                  aria-label={t.name}
                  aria-pressed={active}
                  onClick={() =>
                    onChange({
                      ...value,
                      primaryColor: t.primary,
                      textColor: t.text,
                    })
                  }
                  className={cn(
                    "group flex flex-col items-center gap-1.5 rounded-[14px] border p-2.5 transition",
                    active
                      ? "border-terracotta bg-terracotta/[0.06]"
                      : "border-clay hover:border-terracotta/60",
                  )}
                >
                  <span
                    className="flex h-11 w-full items-center justify-center rounded-[9px] ring-1 ring-black/5"
                    style={{ background: t.primary }}
                  >
                    <span
                      className="text-[0.9rem] font-[500] leading-none"
                      style={{ color: t.text }}
                    >
                      Aa
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-[0.72rem] leading-none transition-colors",
                      active
                        ? "font-[500] text-ink"
                        : "font-[300] text-stone group-hover:text-ink",
                    )}
                  >
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className="w-full border border-clay bg-parchment px-3 py-2 font-[300] text-[0.85rem] text-ink outline-none focus:border-terracotta"
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
                className="w-full border border-clay bg-parchment px-3 py-2 font-[300] text-[0.85rem] text-ink outline-none focus:border-terracotta"
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
              className="shrink-0 self-center text-[0.72rem] font-[400] uppercase tracking-[0.08em] text-terracotta hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/60"
            >
              Ret automatisk
            </button>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Navn på kortet
          </span>
          <input
            value={value.displayName ?? ""}
            onChange={(e) => set("displayName", e.target.value)}
            placeholder={businessName}
            maxLength={40}
            className="border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-terracotta"
          />
          <p className="text-[0.72rem] font-[300] leading-relaxed text-stone">
            Det navn dine kunder ser på kortet. Lad feltet stå tomt for at bruge
            firmanavnet ({businessName}).
          </p>
        </div>

        {allowLogo ? (
          <div className="flex flex-col gap-2">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Logo
            </span>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer border border-clay px-4 py-2 text-[0.78rem] font-[300] uppercase tracking-[0.08em] text-ink hover:border-terracotta hover:text-terracotta">
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
            <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
              Har du et logo, viser kortet det i stedet for butikkens navn.
            </p>
            {logoError ? (
              <p className="text-[0.75rem] font-[300] text-rust">{logoError}</p>
            ) : null}
          </div>
        ) : null}

        {/* Betingelser (valgfri): til/fra + kort tekst. Vises IKKE paa kortet,
            men diskret under "Hent mit stempelkort" for kunden. */}
        <div className="flex flex-col gap-2 border-t border-fog pt-5">
          <div className="flex items-center justify-between gap-4">
            <span className="text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
              Betingelser (valgfri)
            </span>
            <Switch
              checked={termsOn}
              label="Vis betingelser"
              onChange={(on) => {
                setTermsOn(on);
                // Til: gendan kladden. Fra: ryd den gemte vaerdi (kladde beholdes).
                set("terms", on ? termsDraft.trim() || null : null);
              }}
            />
          </div>
          {termsOn ? (
            <>
              <textarea
                value={termsDraft}
                maxLength={TERMS_MAX}
                rows={2}
                onChange={(e) => {
                  setTermsDraft(e.target.value);
                  set("terms", e.target.value.trim() || null);
                }}
                placeholder="Fx: Gælder kun ved køb af kaffe. Kan indløses i alle vores butikker."
                className="resize-none border border-clay bg-parchment px-4 py-2.5 font-[300] text-[0.9rem] leading-relaxed text-ink outline-none focus:border-terracotta"
              />
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
                  Vises når kunden henter kortet og på bagsiden af kortet i
                  Wallet, ikke på kortets forside.
                </p>
                <span
                  className={cn(
                    "shrink-0 text-[0.68rem] tabular-nums",
                    termsDraft.length >= TERMS_MAX ? "text-terracotta" : "text-slate",
                  )}
                >
                  {termsDraft.length} / {TERMS_MAX}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
              Tilføj betingelser f.eks. hvilke produkter kortet gælder for.
              Betingelserne vises, når kunden henter kortet og på bagsiden af
              kortet i Wallet.
            </p>
          )}
        </div>
      </div>

      {/* Live preview: paa mobil oeverst (order-1), paa desktop klaebende til hoejre.
          Skjules, hvis forlaelderen viser sit eget preview. */}
      {hidePreview ? null : (
        <div className="order-1 md:order-none md:sticky md:top-6 md:self-start md:pl-4">
          <p className="mb-3 text-[0.68rem] font-[400] uppercase tracking-[0.12em] text-slate">
            Sådan ser kortet ud
          </p>
          <StampCard
            businessName={value.displayName?.trim() || businessName}
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
      )}
    </div>
  );
}
