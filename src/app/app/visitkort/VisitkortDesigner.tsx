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
import { saveVisitkortDesign } from "./actions";

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
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-fog px-3 py-2">
      <span className="text-[0.78rem] font-[300] text-stone">{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-mono text-[0.72rem] uppercase text-slate">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border border-clay bg-transparent p-0.5"
          aria-label={label}
        />
      </span>
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
  logoUrl,
  qrDataUrl,
  stampsRequired,
  rewardText,
}: Props) {
  const router = useRouter();
  const [design, setDesign] = useState<VisitkortDesign>(initial);
  const [pending, startSave] = useTransition();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set(patch: Partial<VisitkortDesign>) {
    setDesign((d) => ({ ...d, ...patch }));
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
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
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
            Hjørner
          </h2>
          <div className="flex flex-col gap-4">
            <Field label="Design-elementer">
              <Segmented
                options={[
                  { key: "afrundede" as const, label: "Afrundede" },
                  { key: "skarpe" as const, label: "Skarpe" },
                ]}
                value={design.corners}
                onChange={(corners) => set({ corners })}
              />
            </Field>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={design.dieCut}
                onChange={(e) => set({ dieCut: e.target.checked })}
                className="mt-0.5 h-4 w-4 accent-terracotta"
              />
              <span className="text-[0.82rem] font-[300] leading-relaxed text-stone">
                Fysiske runde hjørner (die-cut). Vises i preview og noteres til
                trykken. Bestilles som en mulighed hos Vistaprint.
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-fog bg-white p-5 shadow-card md:p-6">
          <h2 className="mb-4 text-[0.7rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Forside: oplysninger
          </h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={design.showLogo}
                onChange={(e) => set({ showLogo: e.target.checked })}
                className="h-4 w-4 accent-terracotta"
              />
              <span className="text-[0.82rem] font-[300] text-stone">
                Vis logo øverst (ellers butiksnavn)
              </span>
            </label>
            <Field label="Navn / kontaktperson">
              <input className={inputCls} value={design.name} maxLength={60} onChange={(e) => set({ name: e.target.value })} placeholder="Fx: Ali Al-farhan" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Tagline">
                <input className={inputCls} value={design.tagline} maxLength={80} onChange={(e) => set({ tagline: e.target.value })} placeholder="Stempelkortet, der skaber" />
              </Field>
              <Field label="Tagline (accent-farve)">
                <input className={inputCls} value={design.taglineAccent} maxLength={60} onChange={(e) => set({ taglineAccent: e.target.value })} placeholder="flere stamkunder." />
              </Field>
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
              <div className="flex flex-col gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Overskrift">
                    <input className={inputCls} value={design.backHeadline} maxLength={60} onChange={(e) => set({ backHeadline: e.target.value })} placeholder="Saml stempler." />
                  </Field>
                  <Field label="Overskrift (accent-farve)">
                    <input className={inputCls} value={design.backHeadlineAccent} maxLength={60} onChange={(e) => set({ backHeadlineAccent: e.target.value })} placeholder="Få belønninger." />
                  </Field>
                  <Field label="Linje 1 (fremhævet)">
                    <input className={inputCls} value={design.backLine1} maxLength={60} onChange={(e) => set({ backLine1: e.target.value })} placeholder="Direkte i Apple Wallet" />
                  </Field>
                  <Field label="Linje 2">
                    <input className={inputCls} value={design.backLine2} maxLength={60} onChange={(e) => set({ backLine2: e.target.value })} placeholder="Ingen app. Ingen tilmelding." />
                  </Field>
                </div>
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

      {/* Preview + handlinger (sticky paa desktop) */}
      <div className="order-1 flex flex-col gap-5 lg:order-2 lg:sticky lg:top-6">
        <div className="rounded-lg border border-fog bg-sand/40 p-5">
          <span className="mb-2 block text-[0.62rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Forside
          </span>
          <VkPreview side="front" design={design} businessName={businessName} logoUrl={logoUrl} qrDataUrl={qrDataUrl} stampsRequired={stampsRequired} rewardText={rewardText} />
          <span className="mb-2 mt-5 block text-[0.62rem] font-[500] uppercase tracking-[0.14em] text-slate">
            Bagside
          </span>
          <VkPreview side="back" design={design} businessName={businessName} logoUrl={logoUrl} qrDataUrl={qrDataUrl} stampsRequired={stampsRequired} rewardText={rewardText} />
        </div>

        <div className="flex flex-col gap-2">
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
  );
}
