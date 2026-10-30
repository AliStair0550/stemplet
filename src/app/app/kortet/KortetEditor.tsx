"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CardDesigner, type CardDesign } from "@/components/CardDesigner";
import { WalletCardPreview, type PreviewProduct } from "@/components/WalletCardPreview";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CARD_ACTIONS,
  CARD_ACTION_HINT,
  CARD_ACTION_LABEL,
  CARD_STYLES,
  CARD_STYLE_LABEL,
  MAX_CARD_ACTIONS,
  actionUnavailableReason,
  styleAvailable,
  type CardAction,
  type CardLookContext,
  type CardStyle,
} from "@/lib/card-look";
import { ACCENT_SWATCHES, CARD_ARTS, CARD_ART_LABEL, artDataUri, autoAccent, type Art } from "@/lib/card-art";
import { STAMP_ICON_PATHS } from "@/lib/stamp-icon-paths";
import type { StampIconKey } from "@/lib/brand";
import { saveCardLook } from "./actions";

// Kortet: butikkens faelles kortdesign. Stil, farver, navn og logo, eget billede
// og knapper, med en live-forhaandsvisning af plakatkortet (iOS 27) og det
// klassiske kort. Reglerne for stempler og henvisninger ligger under hvert
// produkt; dette er udseendet, der deles.

// Miniature af en stil i butikkens egne farver, saa man ser resultatet, foer
// man vaelger. Samme tegning som kortet (motiver fra lib/card-art).
function StyleThumb({
  style,
  bg,
  fg,
  art,
  accent,
  artwork,
  icon,
}: {
  style: CardStyle;
  bg: string;
  fg: string;
  art: Art;
  accent: string | null;
  artwork: string | null;
  icon: StampIconKey;
}) {
  let look: React.CSSProperties = { background: bg };
  if (style === "art") look = { backgroundColor: bg, backgroundImage: artDataUri(art, { bg, fg, accent }), backgroundSize: "cover" };
  if (style === "photo" && artwork) look = { backgroundImage: `url(${artwork})`, backgroundSize: "cover", backgroundPosition: "center" };
  if (style === "pattern") {
    const markup = STAMP_ICON_PATHS[icon] ?? STAMP_ICON_PATHS.custom;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${fg}" color="${fg}" opacity="0.28" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;
    look = { background: `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 22px 22px, ${bg}` };
  }
  return (
    <span className="relative block aspect-[1/1.42] w-full overflow-hidden rounded-[10px] shadow-[0_6px_16px_-10px_rgba(0,0,0,0.5)]" style={{ ...look, color: fg }} aria-hidden>
      {style === "color" ? <span className="absolute left-2 top-2 h-1.5 w-8 rounded-full" style={{ background: fg, opacity: 0.85 }} /> : null}
      {style === "photo" && !artwork ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="M21 16l-5-5-8 8" />
          </svg>
        </span>
      ) : null}
      {style === "stamps" ? (
        <span className="absolute inset-x-2 top-[22%] grid grid-cols-5 gap-1">
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="aspect-square rounded-full" style={i < 3 ? { background: fg } : { border: `1px solid ${fg}66` }} />
          ))}
        </span>
      ) : null}
      <span className="absolute inset-x-0 bottom-0 h-[22%]" style={{ background: "rgba(0,0,0,0.18)" }} />
    </span>
  );
}

// Beskaer og komprimér i browseren foer upload (serveren goer det igen). Holder
// uploaden lille og hurtig, ogsaa fra en telefon med et 12 MP-foto.
async function prepareArtwork(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const W = 1074;
    const H = 1344;
    const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function KortetEditor({
  initial,
  initialStyle,
  initialArtwork,
  initialArt,
  initialAccent,
  initialActions,
  ctx,
  businessName,
  friendReward,
  referrerReward,
}: {
  initial: CardDesign;
  initialStyle: CardStyle;
  initialArtwork: string | null;
  initialArt: Art;
  initialAccent: string | null;
  initialActions: CardAction[];
  ctx: CardLookContext;
  businessName: string;
  friendReward: string;
  referrerReward: string;
}) {
  const [design, setDesign] = useState<CardDesign>(initial);
  const [style, setStyle] = useState<CardStyle>(initialStyle);
  const [artwork, setArtwork] = useState<string | null>(initialArtwork);
  const [artworkChanged, setArtworkChanged] = useState(false);
  const [art, setArt] = useState<Art>(initialArt);
  const [accent, setAccent] = useState<string | null>(initialAccent);
  const [actions, setActions] = useState<CardAction[]>(initialActions);
  const [os, setOs] = useState<"27" | "old">("27");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const product: PreviewProduct =
    ctx.stampsEnabled && ctx.referralsEnabled ? "begge" : ctx.referralsEnabled ? "henvisninger" : "stemplet";

  const snapshot = useMemo(
    () => JSON.stringify({ design, style, actions, artworkChanged, art, accent }),
    [design, style, actions, artworkChanged, art, accent],
  );
  const savedRef = useRef(
    JSON.stringify({ design: initial, style: initialStyle, actions: initialActions, artworkChanged: false, art: initialArt, accent: initialAccent }),
  );
  const dirty = snapshot !== savedRef.current;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setMsg(null);
    if (!file.type.startsWith("image/")) {
      setMsg({ ok: false, text: "Vælg en billedfil (JPG eller PNG)." });
      return;
    }
    setUploading(true);
    try {
      setArtwork(await prepareArtwork(file));
      setArtworkChanged(true);
      setStyle("photo");
    } catch {
      setMsg({ ok: false, text: "Billedet kunne ikke læses. Prøv et andet." });
    } finally {
      setUploading(false);
    }
  }

  function toggleAction(a: CardAction) {
    setActions((cur) =>
      cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a].slice(-MAX_CARD_ACTIONS),
    );
  }

  function save() {
    setMsg(null);
    start(async () => {
      const res = await saveCardLook({
        design,
        style,
        artwork: artworkChanged ? artwork : "keep",
        actions,
        art,
        accent,
      });
      if (res.ok) {
        savedRef.current = JSON.stringify({ design, style, actions, artworkChanged: false, art, accent });
        setArtworkChanged(false);
        setMsg({ ok: true, text: "Gemt" });
      } else {
        setMsg({ ok: false, text: res.error });
      }
    });
  }

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:gap-12">
      <div className="order-2 flex min-w-0 flex-col gap-4 md:order-none">
        {/* Stil */}
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Stil</h2>
          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {CARD_STYLES.map((s) => {
              const ok = styleAvailable(s, ctx);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={!ok}
                  aria-pressed={style === s}
                  onClick={() => (s === "photo" && !artwork ? fileRef.current?.click() : setStyle(s))}
                  className={cn(
                    "flex flex-col gap-2 rounded-[14px] border-2 p-2 text-left transition-[border-color,transform] active:scale-[0.97] disabled:opacity-40",
                    style === s ? "border-ink" : "border-transparent hover:border-clay",
                  )}
                >
                  <StyleThumb
                    style={s}
                    bg={design.primaryColor}
                    fg={design.textColor}
                    art={art}
                    accent={accent}
                    artwork={artwork}
                    icon={design.stampIcon}
                  />
                  <span className="truncate px-0.5 text-[0.82rem] font-semibold text-ink">{ok ? CARD_STYLE_LABEL[s] : "Kræver stempler"}</span>
                </button>
              );
            })}
          </div>
          {style === "art" ? (
            <div className="mt-5 flex flex-col gap-4">
              <div>
                <p className="mb-2 text-[0.85rem] font-semibold text-ink">Motiv</p>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                  {CARD_ARTS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={art === a}
                      onClick={() => setArt(a)}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-[12px] border-2 p-1.5 transition-[border-color,transform] active:scale-[0.97]",
                        art === a ? "border-ink" : "border-transparent hover:border-clay",
                      )}
                    >
                      <span
                        aria-hidden
                        className="block aspect-[1/1.42] w-full rounded-[8px]"
                        style={{ backgroundColor: design.primaryColor, backgroundImage: artDataUri(a, { bg: design.primaryColor, fg: design.textColor, accent }), backgroundSize: "cover" }}
                      />
                      <span className="text-[0.78rem] font-medium text-ink">{CARD_ART_LABEL[a]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-[0.85rem] font-semibold text-ink">Accent</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {[null, ...ACCENT_SWATCHES].map((c) => {
                    const shown = c ?? autoAccent(design.primaryColor, design.textColor);
                    return (
                      <button
                        key={c ?? "auto"}
                        type="button"
                        aria-pressed={accent === c}
                        aria-label={c ? `Accent ${c}` : "Automatisk accent"}
                        onClick={() => setAccent(c)}
                        className={cn(
                          "flex h-10 items-center gap-2 rounded-full border-2 pl-1 transition-colors",
                          c ? "w-10 justify-center pl-0" : "pr-3",
                          accent === c ? "border-ink" : "border-transparent hover:border-clay",
                        )}
                      >
                        <span className="h-7 w-7 rounded-full ring-1 ring-inset ring-black/10" style={{ background: shown }} />
                        {c ? null : <span className="text-[0.8rem] font-medium text-ink">Auto</span>}
                      </button>
                    );
                  })}
                  <label className="flex h-10 cursor-pointer items-center gap-2 rounded-full border-2 border-transparent pl-1 pr-3 hover:border-clay">
                    <span
                      className="h-7 w-7 rounded-full ring-1 ring-inset ring-black/10"
                      style={{ background: "conic-gradient(#E88B9B, #E7A15B, #C9A24B, #8FD1A6, #7CC4FF, #B9A4E8, #E88B9B)" }}
                    />
                    <span className="text-[0.8rem] font-medium text-ink">Egen</span>
                    <input
                      type="color"
                      value={accent ?? autoAccent(design.primaryColor, design.textColor)}
                      onChange={(e) => setAccent(e.target.value.toUpperCase())}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}
          {style === "photo" ? (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {artwork ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={artwork} alt="Dit billede" className="h-20 w-16 rounded-lg object-cover" />
              ) : null}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className={btnClass("outline")}>
                {uploading ? "Indlæser..." : artwork ? "Skift billede" : "Upload billede"}
              </button>
              {artwork ? (
                <button
                  type="button"
                  onClick={() => {
                    setArtwork(null);
                    setArtworkChanged(true);
                    if (style === "photo") setStyle("color");
                  }}
                  className="text-[0.85rem] text-stone underline underline-offset-2 hover:text-ink"
                >
                  Fjern billede
                </button>
              ) : null}
              <p className="w-full text-[0.8rem] text-slate">
                Et stående foto virker bedst, fx din salon eller dit produkt. Vi beskærer det og gør bunden mørkere, så teksten kan læses.
              </p>
            </div>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </section>

        {/* Farver, navn og logo (faelles kortdesigner, kun udseende) */}
        <CardDesigner value={design} onChange={setDesign} businessName={businessName} allowLogo boxed hidePreview parts="look" />

        {/* Knapper */}
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Knapper på kortet</h2>
          <p className="mt-0.5 text-[0.88rem] text-stone">Genveje under kortet i Wallet (iOS 27). Kunden trykker på dem direkte fra kortet.</p>
          <div className="mt-4 flex flex-col gap-2">
            {CARD_ACTIONS.map((a) => {
              const reason = actionUnavailableReason(a, ctx);
              const on = actions.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  disabled={!!reason}
                  aria-pressed={on}
                  onClick={() => toggleAction(a)}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-[14px] border px-4 py-3 text-left transition-colors disabled:opacity-50",
                    on ? "border-ink bg-white" : "border-fog hover:border-clay",
                  )}
                >
                  <span>
                    <span className="block text-[0.95rem] font-semibold text-ink">{CARD_ACTION_LABEL[a]}</span>
                    <span className="block text-[0.78rem] text-slate">{reason ?? CARD_ACTION_HINT[a]}</span>
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.8rem]",
                      on ? "border-ink bg-ink text-white" : "border-clay text-transparent",
                    )}
                  >
                    ✓
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="sticky bottom-[calc(4.9rem+env(safe-area-inset-bottom))] md:bottom-0 z-20 -mx-1 flex flex-wrap items-center gap-3 bg-parchment px-1 py-4">
          <button onClick={save} disabled={pending || uploading} className={btnClass("primary")}>
            {pending ? "Gemmer..." : "Gem kortet"}
          </button>
          {dirty ? (
            <span className="text-[0.82rem] text-slate">Ikke gemt endnu</span>
          ) : msg ? (
            <span className={cn("text-[0.82rem]", msg.ok ? "text-ink" : "text-rust")}>{msg.text}</span>
          ) : null}
          {dirty && msg && !msg.ok ? <span className="text-[0.82rem] text-rust">{msg.text}</span> : null}
        </div>
      </div>

      {/* Forhaandsvisning */}
      <aside className="order-1 md:order-none">
        <div className="flex flex-col items-center gap-3 md:sticky md:top-6">
          <div className="flex rounded-full bg-[#F2F5F9] p-1">
            {(
              [
                ["27", "iOS 27"],
                ["old", "Ældre iPhone"],
              ] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                aria-pressed={os === v}
                onClick={() => setOs(v)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[0.82rem]",
                  os === v ? "bg-ink font-semibold text-white" : "text-stone",
                )}
              >
                {l}
              </button>
            ))}
          </div>
          <WalletCardPreview
            os={os}
            style={style === "photo" && !artwork ? "color" : style}
            artwork={artwork}
            art={art}
            accent={accent}
            primaryColor={design.primaryColor}
            textColor={design.textColor}
            logoUrl={design.logoUrl ?? null}
            header={design.cardHeader}
            name={design.displayName?.trim() || businessName}
            stampIcon={design.stampIcon}
            stampsRequired={design.stampsRequired}
            rewardText={design.rewardText}
            product={product}
            friendReward={friendReward}
            referrerReward={referrerReward}
            actions={actions}
          />
          <p className="max-w-[300px] text-center text-[0.78rem] text-slate">
            {os === "27"
              ? "Eksempel på en kundes kort. Plakatkortet på iOS 27."
              : "Eksempel på en kundes kort. Ældre iPhones får det klassiske kort."}
          </p>
        </div>
      </aside>
    </div>
  );
}
