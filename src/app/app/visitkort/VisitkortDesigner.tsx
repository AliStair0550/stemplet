"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  VK_TEMPLATES,
  VK_FONTS,
  VK_COLOR_THEMES,
  type VisitkortDesign,
  type VkTemplate,
  type VkFont,
  type VkColors,
} from "@/lib/visitkort";
import { VkPreview } from "./VkPreview";
import { saveVisitkortDesign, setBusinessLogo } from "./actions";

// Skalerer logoet ned til en komprimeret data-URL i browseren (samme princip som
// kort-designeren), saa det gemmes direkte uden en ekstern tjeneste.
function processLogo(file: File, maxDim = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const s = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
        const w = Math.max(1, Math.round((img.width || maxDim) * s));
        const h = Math.max(1, Math.round((img.height || maxDim) * s));
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

type Props = {
  initial: VisitkortDesign;
  brand: { primary: string; text: string };
  businessName: string;
  logoUrl: string | null;
  qrDataUrl: string;
  stampsRequired: number;
  rewardText: string;
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full border border-clay bg-parchment px-3 py-2.5 font-[300] text-[0.9rem] text-ink outline-none focus:border-terracotta";

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const valid = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-lg border border-fog p-2.5">
      <span className="truncate text-[0.7rem] font-[400] text-stone">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={valid ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-8 shrink-0 cursor-pointer rounded border border-clay bg-transparent p-0.5"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            let v = e.target.value.trim();
            if (v && !v.startsWith("#")) v = `#${v}`;
            onChange(v);
          }}
          spellCheck={false}
          aria-label={`${label} hex`}
          className="w-full min-w-0 flex-1 border-b border-clay bg-transparent font-mono text-[0.72rem] uppercase text-slate outline-none focus:border-terracotta"
        />
      </div>
    </div>
  );
}

function BoldToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[0.68rem] font-[400] text-slate">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-3.5 w-3.5 accent-terracotta" />
      Fed
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  bold,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  bold?: { value: boolean; onChange: (v: boolean) => void };
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center justify-between">
        <span className="text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">{label}</span>
        {bold ? <BoldToggle checked={bold.value} onChange={bold.onChange} /> : null}
      </span>
      <input
        className={inputCls}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  cols,
}: {
  options: { key: T; label: string; note?: string }[];
  value: T;
  onChange: (v: T) => void;
  cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols ?? options.length}, minmax(0,1fr))` }}>
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={cn(
              "rounded-lg border px-3 py-2 text-left transition-colors",
              active ? "border-terracotta bg-terracotta/[0.06]" : "border-fog hover:border-clay",
            )}
          >
            <span className={cn("block text-[0.85rem] font-[400]", active ? "text-terracotta" : "text-ink")}>
              {o.label}
            </span>
            {o.note ? (
              <span className="mt-0.5 block text-[0.7rem] font-[300] leading-snug text-stone">
                {o.note}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function VisitkortDesigner({
  initial,
  brand,
  businessName,
  logoUrl: initialLogo,
  qrDataUrl,
  stampsRequired,
  rewardText,
}: Props) {
  const router = useRouter();
  const [design, setDesign] = useState<VisitkortDesign>(initial);
  const [logo, setLogo] = useState<string | null>(initialLogo);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [view, setView] = useState<"front" | "back">("front");
  const [pending, startSave] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set(patch: Partial<VisitkortDesign>) {
    setDesign((d) => ({ ...d, ...patch }));
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
      const dataUrl = await processLogo(file);
      setLogo(dataUrl); // live i preview med det samme
      const res = await setBusinessLogo(dataUrl); // gem, saa PDF'en ogsaa faar det
      if (!res.ok) setLogoError(res.error ?? "Kunne ikke gemme logoet.");
      else set({ showLogo: true });
    } catch {
      setLogoError("Kunne ikke læse billedet. Prøv et andet.");
    } finally {
      setUploading(false);
    }
  }

  function removeLogo() {
    setLogo(null);
    setLogoError(null);
    setBusinessLogo(null).catch(() => {});
  }

  function applyTheme(colors: VkColors) {
    setDesign((d) => ({ ...d, front: { ...colors }, back: { ...colors } }));
  }

  function save() {
    setMsg(null);
    startSave(async () => {
      const res = await saveVisitkortDesign(design);
      if (res.ok) {
        setMsg({ ok: true, text: "Design gemt." });
        router.refresh();
      } else {
        setMsg({ ok: false, text: res.error ?? "Kunne ikke gemme." });
      }
    });
  }

  async function download() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/visitkort", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ design }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "stemplet-visitkort.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 15000);
      // Gem ogsaa designet, saa det er bevaret naeste gang.
      saveVisitkortDesign(design).catch(() => {});
      setMsg({ ok: true, text: "PDF hentet. Klar til Vistaprint." });
    } catch {
      setMsg({ ok: false, text: "Kunne ikke lave PDF'en lige nu. Prøv igen." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-start">
      {/* Kontroller */}
      <div className="order-2 flex flex-col gap-6 lg:order-1">
        <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
          <h2 className="mb-4 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Skabelon og format
          </h2>
          <div className="flex flex-col gap-4">
            <Field label="Skabelon">
              <Segmented
                options={VK_TEMPLATES.map((t) => ({ key: t.key, label: t.label, note: t.note }))}
                value={design.template}
                onChange={(template: VkTemplate) => set({ template })}
                cols={2}
              />
            </Field>
            <Field label="Retning">
              <Segmented
                options={[
                  { key: "landscape" as const, label: "Liggende" },
                  { key: "portrait" as const, label: "Stående" },
                ]}
                value={design.orientation}
                onChange={(orientation) => set({ orientation })}
              />
            </Field>
            <Field label="Font">
              <Segmented
                options={VK_FONTS.map((f) => ({ key: f.key, label: f.label }))}
                value={design.font}
                onChange={(font: VkFont) => set({ font })}
              />
            </Field>
            <Field label="Hjørner">
              <Segmented
                options={[
                  { key: "skarpe" as const, label: "Kantede", note: "Standard, skarpe hjørner" },
                  { key: "afrundede" as const, label: "Afrundede", note: "Runde hjørner og felter" },
                ]}
                value={design.corners}
                onChange={(corners) => set({ corners, dieCut: corners === "afrundede" })}
              />
            </Field>
            <p className="text-[0.76rem] font-[300] leading-relaxed text-slate">
              {design.corners === "afrundede"
                ? "Afrunder både kortets hjørner og design-elementer. Runde kort-hjørner bestilles som die-cut hos Vistaprint."
                : "Kantede hjørner er standard. Vælg Afrundede for runde hjørner og felter."}
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
          <h2 className="mb-4 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Farver
          </h2>
          <div className="flex flex-col gap-5">
            <div>
              <span className="mb-2 block text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">
                Hurtige temaer (sætter begge sider)
              </span>
              <div className="flex flex-wrap gap-2">
                {VK_COLOR_THEMES.map((t) => {
                  const accent = t.accentFromBrand ? brand.primary : (t.accent ?? t.text);
                  return (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => applyTheme({ bg: t.bg, text: t.text, accent })}
                      title={t.name}
                      className="flex items-center gap-1.5 rounded-full border border-clay py-1 pl-1.5 pr-3"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: t.bg, border: "1px solid rgba(0,0,0,0.1)" }}>
                        <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
                      </span>
                      <span className="text-[0.74rem] font-[400] text-stone">{t.name}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => applyTheme({ bg: brand.primary, text: brand.text, accent: brand.text })}
                  className="rounded-full border border-clay px-3 text-[0.74rem] font-[400] text-stone hover:text-ink"
                >
                  Brand
                </button>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">
                Forside
              </span>
              <div className="grid gap-2 sm:grid-cols-3">
                <ColorField label="Baggrund" value={design.front.bg} onChange={(bg) => set({ front: { ...design.front, bg } })} />
                <ColorField label="Tekst" value={design.front.text} onChange={(text) => set({ front: { ...design.front, text } })} />
                <ColorField label="Accent" value={design.front.accent} onChange={(accent) => set({ front: { ...design.front, accent } })} />
              </div>
            </div>
            <div>
              <span className="mb-2 block text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">
                Bagside
              </span>
              <div className="grid gap-2 sm:grid-cols-3">
                <ColorField label="Baggrund" value={design.back.bg} onChange={(bg) => set({ back: { ...design.back, bg } })} />
                <ColorField label="Tekst" value={design.back.text} onChange={(text) => set({ back: { ...design.back, text } })} />
                <ColorField label="Accent" value={design.back.accent} onChange={(accent) => set({ back: { ...design.back, accent } })} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
          <h2 className="mb-4 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Forside: oplysninger
          </h2>
          <div className="flex flex-col gap-4">
            {/* Logo: upload + vis/skjul + stoerrelse */}
            <div className="flex flex-col gap-2 rounded-lg border border-fog bg-parchment/40 p-3">
              <span className="text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">Logo</span>
              <div className="flex flex-wrap items-center gap-3">
                <label className={`${btnClass("outline")} cursor-pointer`}>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleLogo(f);
                      e.target.value = "";
                    }}
                  />
                  {uploading ? "Uploader..." : logo ? "Skift logo" : "Upload logo"}
                </label>
                {logo ? (
                  <button type="button" onClick={removeLogo} className="text-[0.75rem] font-[400] text-slate transition-colors hover:text-rust">
                    Fjern logo
                  </button>
                ) : null}
              </div>
              {logoError ? <p className="text-[0.75rem] font-[300] text-rust">{logoError}</p> : null}
              {logo ? (
                <>
                  <label className="mt-1 flex items-center gap-3">
                    <input type="checkbox" checked={design.showLogo} onChange={(e) => set({ showLogo: e.target.checked })} className="h-4 w-4 accent-terracotta" />
                    <span className="text-[0.82rem] font-[300] text-stone">Vis logo på visitkortet</span>
                  </label>
                  {design.showLogo ? (
                    <div className="mt-1 flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[0.66rem] font-[500] uppercase tracking-[0.1em] text-slate">
                        Logo-størrelse
                        {Math.abs(design.logoScale - 1) > 0.001 ? (
                          <button type="button" onClick={() => set({ logoScale: 1 })} className="font-[400] normal-case tracking-normal text-terracotta hover:opacity-70">
                            Nulstil
                          </button>
                        ) : null}
                      </span>
                      <input type="range" min={0.5} max={2.2} step={0.05} value={design.logoScale} onChange={(e) => set({ logoScale: Number(e.target.value) })} className="w-full accent-terracotta" />
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-[0.76rem] font-[300] leading-relaxed text-slate">
                  Uden logo vises butiksnavnet som tekst øverst. Logoet deles med
                  dit digitale kort.
                </p>
              )}
            </div>

            <TextField label="Navn / kontaktperson" value={design.name} maxLength={60} onChange={(v) => set({ name: v })} placeholder="Fx: Ali Al-farhan" bold={{ value: design.nameBold, onChange: (v) => set({ nameBold: v }) }} />
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField label="Tagline" value={design.tagline} maxLength={80} onChange={(v) => set({ tagline: v })} placeholder="Stempelkortet, der skaber" bold={{ value: design.taglineBold, onChange: (v) => set({ taglineBold: v }) }} />
              <TextField label="Tagline (accent-farve)" value={design.taglineAccent} maxLength={60} onChange={(v) => set({ taglineAccent: v })} placeholder="flere stamkunder." />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Telefon">
                <input className={inputCls} value={design.phone} maxLength={40} onChange={(e) => set({ phone: e.target.value })} placeholder="+45 12 34 56 78" />
              </Field>
              <Field label="E-mail">
                <input className={inputCls} value={design.email} maxLength={80} onChange={(e) => set({ email: e.target.value })} placeholder="hej@butik.dk" />
              </Field>
              <Field label="Web">
                <input className={inputCls} value={design.web} maxLength={80} onChange={(e) => set({ web: e.target.value })} placeholder="butik.dk" />
              </Field>
              <Field label="Adresse">
                <input className={inputCls} value={design.address} maxLength={120} onChange={(e) => set({ address: e.target.value })} placeholder="Gadenavn 1, 8000 Aarhus" />
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
          <h2 className="mb-4 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Bagside
          </h2>
          <div className="flex flex-col gap-4">
            <Segmented
              options={[
                { key: "qr" as const, label: "QR med tekst", note: "Overskrift + QR + to linjer" },
                { key: "stempelkort" as const, label: "Stempelkort", note: "Belønning + felter + QR" },
              ]}
              value={design.backContent}
              onChange={(backContent) => set({ backContent })}
            />
            {design.backContent === "qr" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField label="Overskrift" value={design.backHeadline} maxLength={60} onChange={(v) => set({ backHeadline: v })} placeholder="Saml stempler." bold={{ value: design.headlineBold, onChange: (v) => set({ headlineBold: v }) }} />
                <TextField label="Overskrift (accent-farve)" value={design.backHeadlineAccent} maxLength={60} onChange={(v) => set({ backHeadlineAccent: v })} placeholder="Få belønninger." />
                <TextField label="Linje 1" value={design.backLine1} maxLength={60} onChange={(v) => set({ backLine1: v })} placeholder="Direkte i Apple Wallet" bold={{ value: design.line1Bold, onChange: (v) => set({ line1Bold: v }) }} />
                <TextField label="Linje 2" value={design.backLine2} maxLength={60} onChange={(v) => set({ backLine2: v })} placeholder="Ingen app. Ingen tilmelding." bold={{ value: design.line2Bold, onChange: (v) => set({ line2Bold: v }) }} />
              </div>
            ) : (
              <p className="text-[0.78rem] font-[300] leading-relaxed text-slate">
                Stempelkort-siden bruger butikkens belønningstekst fra Design-siden
                og viser tomme stempel-felter samt QR-koden.
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Preview + handlinger. Sticky, saa aendringer altid ses live. */}
      <div className="order-1 lg:order-2">
        <div className="sticky top-4 flex flex-col gap-4 rounded-lg border border-fog bg-sand/40 p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex rounded-full border border-clay p-0.5">
              {[
                { v: "front" as const, label: "Forside" },
                { v: "back" as const, label: "Bagside" },
              ].map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={view === o.v}
                  onClick={() => setView(o.v)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[0.8rem] transition-colors",
                    view === o.v ? "bg-terracotta text-parchment" : "text-stone hover:text-ink",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-[0.62rem] font-[500] uppercase tracking-[0.12em] text-terracotta">
              <span className="h-1.5 w-1.5 rounded-full bg-terracotta" /> Live
            </span>
          </div>

          <VkPreview side={view} design={design} businessName={businessName} logoUrl={logo} qrDataUrl={qrDataUrl} stampsRequired={stampsRequired} rewardText={rewardText} />

          <div className="flex flex-col gap-2 border-t border-fog pt-3">
          <button type="button" onClick={download} disabled={busy} className={cn(btnClass("primary", "lg"), "w-full disabled:opacity-60")}>
            {busy ? "Laver PDF..." : "Hent tryk-klar PDF"}
          </button>
          <button type="button" onClick={save} disabled={pending} className={cn(btnClass("outline"), "w-full")}>
            {pending ? "Gemmer..." : "Gem design"}
          </button>
          <div aria-live="polite" className="min-h-[1.1rem]">
            {msg ? (
              <p className={cn("text-[0.8rem] font-[300]", msg.ok ? "text-terracotta" : "text-rust")}>
                {msg.text}
              </p>
            ) : null}
          </div>
          <p className="text-[0.72rem] font-[300] leading-relaxed text-slate">
            PDF&apos;en er 85 × 55 mm med 3 mm beskæring og skæremærker: side 1
            forside, side 2 bagside. Upload den direkte til Vistaprint.
          </p>
          </div>
        </div>
      </div>
    </div>
  );
}
