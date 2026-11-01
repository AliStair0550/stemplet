"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { btnClass } from "@/components/ui";
import { prepareImage } from "@/lib/prepare-image";
import {
  DEFAULT_POSTER_SETTINGS,
  MATERIAL_HEADLINE_MAX,
  REFERRAL_HEADLINES,
  type PosterBg as Bg,
  type PosterFocus,
  type PosterSettings,
  type PosterSize as Size,
} from "@/lib/materials";
import { savePosterSettings, setPosterPhoto } from "./actions";

// Plakatens valg og en live-visning af den rigtige PDF (samme URL som
// download), saa det, man ser, er praecis det, der bliver trykt.


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
  photo,
  ownPhoto,
  designPhoto,
  photoVersion,
  saved,
  cardHeadline,
}: {
  stampsEnabled: boolean;
  referralsEnabled: boolean;
  /** Billedet paa plakaten: plakatens eget eller billedet fra Design. */
  photo: string | null;
  /** Plakaten har sit eget billede (ikke Designs). */
  ownPhoto: boolean;
  designPhoto: boolean;
  /** Skifter, naar billedet skifter, saa forhaandsvisningen hentes igen. */
  photoVersion: string;
  /** De sidst gemte valg (null = foerste gang). */
  saved: PosterSettings | null;
  /** "Hent dit Sara Salon-kort" */
  cardHeadline: string;
}) {
  const router = useRouter();
  const start0 = saved ?? { ...DEFAULT_POSTER_SETTINGS, bg: photo ? ("billede" as Bg) : ("farve" as Bg) };
  const [focus, setFocus] = useState<PosterFocus>(start0.focus);
  const [size, setSize] = useState<Size>(start0.size);
  const [bg, setBg] = useState<Bg>(start0.bg === "billede" && !photo ? "farve" : start0.bg);
  const [brand, setBrand] = useState(start0.brand);
  const [grid, setGrid] = useState(start0.grid);
  const [headline, setHeadline] = useState(start0.headline);
  const [savedNote, setSavedNote] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [photoError, setPhotoError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Valgene gemmes automatisk kort efter sidste aendring, saa man ikke starter
  // forfra. Kun naar noget faktisk er aendret, og en ventende aendring gemmes med
  // det samme, hvis man forlader siden.
  const current = JSON.stringify({ focus, size, bg, brand, grid, headline });
  const lastSaved = useRef(JSON.stringify(start0));
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (current === lastSaved.current) return;
    pending.current = current;
    const t = setTimeout(() => {
      const snap = pending.current;
      if (!snap) return;
      pending.current = null;
      lastSaved.current = snap;
      void savePosterSettings(JSON.parse(snap)).then(() => {
        setSavedNote(true);
        setTimeout(() => setSavedNote(false), 1800);
      });
    }, 500);
    return () => clearTimeout(t);
  }, [current]);
  useEffect(
    () => () => {
      if (pending.current) {
        lastSaved.current = pending.current;
        void savePosterSettings(JSON.parse(pending.current));
        pending.current = null;
      }
    },
    [],
  );

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoError(null);
    if (!file.type.startsWith("image/")) {
      setPhotoError("Vælg en billedfil (JPG eller PNG).");
      return;
    }
    startUpload(async () => {
      try {
        const res = await setPosterPhoto(await prepareImage(file));
        if (!res.ok) {
          setPhotoError(res.error);
          return;
        }
        setBg("billede");
        router.refresh();
      } catch {
        setPhotoError("Billedet kunne ikke læses. Prøv et andet.");
      }
    });
  }

  function useDesignPhoto() {
    startUpload(async () => {
      await setPosterPhoto(null);
      if (!designPhoto) setBg("farve");
      router.refresh();
    });
  }

  const defaultHeadline = focus === "henvis" ? "Henvis en ven" : cardHeadline;
  const suggestions =
    focus === "henvis"
      ? [...REFERRAL_HEADLINES]
      : [cardHeadline, ...(stampsEnabled ? ["Saml stempler, få en belønning"] : []), "Bliv stamkunde"];

  const url = useMemo(() => {
    const q = new URLSearchParams({ fokus: focus, bg, navn: brand ? "1" : "0", stempler: grid ? "1" : "0" });
    if (headline.trim()) q.set("titel", headline.trim());
    // v: nyt billede = ny adresse, saa forhaandsvisningen hentes igen.
    if (bg === "billede") q.set("v", photoVersion);
    return `/api/materials/${size}?${q.toString()}`;
  }, [focus, size, bg, brand, grid, headline, photoVersion]);

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
      {/* Paa mobil: plakaten og "Hent PDF" foerst, valgene nedenunder. Standarden
          er god nok til de fleste, saa man skal ikke rulle forbi fem bokse. */}
      <div className="flex min-w-0 flex-col gap-4">
        <h2 className="text-[1.05rem] font-semibold tracking-[-0.01em] text-ink lg:hidden">Tilpas plakaten</h2>
        {referralsEnabled ? (
          <Box title="Hvad skal plakaten?">
            <Choice<PosterFocus>
              value={focus}
              onChange={(v) => {
                setFocus(v);
                setHeadline("");
              }}
              options={[
                { key: "kort", label: "Hent loyalitetskortet", note: "Til nye kunder" },
                { key: "henvis", label: "Henvis en ven", note: "Til kunder med kortet" },
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
            // Uden billede aabner "Dit billede" filvaelgeren direkte.
            onChange={(v) => (v === "billede" && !photo ? fileRef.current?.click() : setBg(v))}
            options={[
              { key: "farve", label: "Kortets farve" },
              { key: "lys", label: "Lys", note: "Sparer blæk" },
              { key: "billede", label: "Dit billede", note: photo ? (ownPhoto ? "Plakatens billede" : "Fra Design") : "Upload et billede" },
            ]}
          />
          {bg === "billede" || !photo ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Plakatens billede" className="h-16 w-12 rounded-lg object-cover" />
              ) : null}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-busy={uploading} className={btnClass("outline")}>
                {uploading ? "Gemmer billedet..." : photo ? "Skift billede" : "Upload billede"}
              </button>
              {ownPhoto ? (
                <button type="button" onClick={useDesignPhoto} disabled={uploading} className="text-[0.85rem] text-stone underline underline-offset-2 hover:text-ink">
                  {designPhoto ? "Brug billedet fra Design" : "Fjern billede"}
                </button>
              ) : null}
              {photoError ? <p className="w-full text-[0.82rem] text-rust">{photoError}</p> : null}
            </div>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              pickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
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
          {focus === "kort" && stampsEnabled ? (
            <label className="flex items-center gap-3 py-1 text-[0.92rem] text-ink">
              <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} className="h-5 w-5 accent-[#061C3D]" />
              Stemplerne (på A4 og A5)
            </label>
          ) : null}
        </Box>
      </div>

      <aside className="order-first mx-auto flex w-full max-w-[300px] flex-col gap-3 lg:sticky lg:top-6 lg:order-none lg:mx-0 lg:max-w-none lg:self-start">
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
          href={`${url}&hent=1`}
          download
          className="flex min-h-12 items-center justify-center rounded-full bg-ink px-6 text-[0.95rem] font-semibold text-white hover:bg-[#0A2D5A]"
        >
          Hent PDF
        </a>
        <p className="text-center text-[0.78rem] text-slate" aria-live="polite">{savedNote ? "Plakaten er gemt" : "Dine valg gemmes automatisk"}</p>
      </aside>
    </div>
  );
}
