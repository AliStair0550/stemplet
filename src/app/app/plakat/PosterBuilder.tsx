"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { MATERIAL_HEADLINE_MAX, REFERRAL_HEADLINES, type PosterFocus } from "@/lib/materials";

// Plakatens valg og en live-visning af den rigtige PDF (samme URL som
// download), saa det, man ser, er praecis det, der bliver trykt.

type Size = "plakat" | "a5" | "skilt";
type Bg = "farve" | "lys" | "billede";

const SIZES: { key: Size; label: string; note: string }[] = [
  { key: "plakat", label: "A4", note: "Plakat til døren" },
  { key: "a5", label: "A5", note: "Skilt i vinduet" },
  { key: "skilt", label: "A6", note: "Lille diskskilt" },
];

function Choice<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: T; label: string; note?: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          disabled={o.disabled}
          aria-pressed={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            "flex flex-col rounded-[14px] border-2 px-3 py-2.5 text-left transition-colors disabled:opacity-40",
            value === o.key ? "border-ink" : "border-fog hover:border-clay",
          )}
        >
          <span className="text-[0.95rem] font-semibold text-ink">{o.label}</span>
          {o.note ? <span className="text-[0.78rem] leading-snug text-stone">{o.note}</span> : null}
        </button>
      ))}
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
      <h2 className="mb-3 text-[1.05rem] font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function PosterBuilder({
  stampsEnabled,
  referralsEnabled,
  hasPhoto,
  cardHeadline,
}: {
  stampsEnabled: boolean;
  referralsEnabled: boolean;
  hasPhoto: boolean;
  /** "Hent dit Sara Salon-kort" */
  cardHeadline: string;
}) {
  const [focus, setFocus] = useState<PosterFocus>(stampsEnabled ? "kort" : "henvis");
  const [size, setSize] = useState<Size>("plakat");
  const [bg, setBg] = useState<Bg>(hasPhoto ? "billede" : "farve");
  const [brand, setBrand] = useState(true);
  const [grid, setGrid] = useState(true);
  const [headline, setHeadline] = useState("");

  const defaultHeadline = focus === "henvis" ? "Henvis en ven" : cardHeadline;
  const suggestions = focus === "henvis" ? [...REFERRAL_HEADLINES] : [cardHeadline, "Saml stempler, få en belønning", "Bliv stamkunde"];

  const url = useMemo(() => {
    const q = new URLSearchParams({ fokus: focus, bg, navn: brand ? "1" : "0", stempler: grid ? "1" : "0" });
    if (headline.trim()) q.set("titel", headline.trim());
    return `/api/materials/${size}?${q.toString()}`;
  }, [focus, size, bg, brand, grid, headline]);

  // Live-visningen opdateres kort efter sidste aendring (PDF'en tager et oejeblik).
  const [previewUrl, setPreviewUrl] = useState(url);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setPreviewUrl(url);
    }, 600);
    return () => clearTimeout(t);
  }, [url]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
      <div className="flex min-w-0 flex-col gap-4">
        {stampsEnabled && referralsEnabled ? (
          <Box title="Hvad skal plakaten?">
            <Choice<PosterFocus>
              value={focus}
              onChange={(v) => {
                setFocus(v);
                setHeadline("");
              }}
              options={[
                { key: "kort", label: "Hent kortet", note: "QR til dit kort" },
                { key: "henvis", label: "Henvis en ven", note: "QR til henvisningssiden" },
              ]}
            />
          </Box>
        ) : null}

        <Box title="Størrelse">
          <Choice<Size> value={size} onChange={setSize} options={SIZES} />
        </Box>

        <Box title="Baggrund">
          <Choice<Bg>
            value={bg}
            onChange={setBg}
            options={[
              { key: "farve", label: "Kortets farve" },
              { key: "lys", label: "Lys", note: "Sparer blæk" },
              { key: "billede", label: "Dit billede", note: hasPhoto ? "Fra Design" : "Upload under Design", disabled: !hasPhoto },
            ]}
          />
        </Box>

        <Box title="Overskrift">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            maxLength={MATERIAL_HEADLINE_MAX}
            placeholder={defaultHeadline}
            aria-label="Overskrift"
            className="w-full rounded-xl border border-fog bg-[#F2F5F9] px-4 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-ink"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHeadline(h === defaultHeadline ? "" : h)}
                className="rounded-full border border-clay px-3 py-1 text-[0.8rem] text-stone hover:border-ink hover:text-ink"
              >
                {h}
              </button>
            ))}
          </div>
        </Box>

        <Box title="Vis på plakaten">
          <label className="flex items-center gap-3 py-1 text-[0.92rem] text-ink">
            <input type="checkbox" checked={brand} onChange={(e) => setBrand(e.target.checked)} className="h-5 w-5 accent-[#061C3D]" />
            Logo eller butiksnavn
          </label>
          {focus === "kort" ? (
            <label className="flex items-center gap-3 py-1 text-[0.92rem] text-ink">
              <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} className="h-5 w-5 accent-[#061C3D]" />
              Stemplerne (på A4 og A5)
            </label>
          ) : null}
        </Box>
      </div>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
        <div className="relative aspect-[210/297] w-full overflow-hidden rounded-[14px] border border-fog bg-[#F2F5F9] shadow-card">
          <iframe
            key={previewUrl}
            src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
            title="Plakat"
            onLoad={() => setLoading(false)}
            className="h-full w-full"
          />
          {loading ? (
            <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-[0.85rem] text-stone">
              Laver plakaten...
            </span>
          ) : null}
        </div>
        <a
          href={url}
          download
          className="flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-[0.95rem] font-semibold text-white hover:bg-[#0A2D5A]"
        >
          Hent PDF
        </a>
        <p className="text-center text-[0.78rem] text-slate">Tryk på almindeligt papir, eller send PDF&apos;en til et trykkeri.</p>
      </aside>
    </div>
  );
}
