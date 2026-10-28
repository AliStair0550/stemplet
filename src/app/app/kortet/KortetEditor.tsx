"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { CardDesigner, type CardDesign } from "@/components/CardDesigner";
import { WalletCardPreview, type PreviewProduct } from "@/components/WalletCardPreview";
import { btnClass } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  CARD_ACTIONS,
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
import { saveCardLook } from "./actions";
import { CARD_NAME_MAX, autoCardName, claimCta } from "@/lib/card-name";

// Kortet: butikkens faelles kortdesign. Stil, farver, navn og logo, eget billede
// og knapper, med en live-forhaandsvisning af plakatkortet (iOS 27) og det
// klassiske kort. Reglerne for stempler og henvisninger ligger under hvert
// produkt; dette er udseendet, der deles.

const STYLE_HINT: Record<CardStyle, string> = {
  color: "Din farve og dit navn",
  photo: "Upload dit eget foto",
  pattern: "Dit stempel som mønster",
  stamps: "Dine stempler på kortet",
};

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
  initialActions,
  initialCardName,
  ctx,
  businessName,
  friendReward,
  referrerReward,
}: {
  initial: CardDesign;
  initialStyle: CardStyle;
  initialArtwork: string | null;
  initialActions: CardAction[];
  initialCardName: string;
  ctx: CardLookContext;
  businessName: string;
  friendReward: string;
  referrerReward: string;
}) {
  const [design, setDesign] = useState<CardDesign>(initial);
  const [style, setStyle] = useState<CardStyle>(initialStyle);
  const [artwork, setArtwork] = useState<string | null>(initialArtwork);
  const [artworkChanged, setArtworkChanged] = useState(false);
  const [actions, setActions] = useState<CardAction[]>(initialActions);
  const [cardName, setCardName] = useState(initialCardName);
  const [os, setOs] = useState<"27" | "old">("27");
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const product: PreviewProduct =
    ctx.stampsEnabled && ctx.referralsEnabled ? "begge" : ctx.referralsEnabled ? "henvisninger" : "stemplet";

  const snapshot = useMemo(
    () => JSON.stringify({ design, style, actions, cardName, artworkChanged }),
    [design, style, actions, cardName, artworkChanged],
  );
  const savedRef = useRef(
    JSON.stringify({ design: initial, style: initialStyle, actions: initialActions, cardName: initialCardName, artworkChanged: false }),
  );
  // Automatisk navn ud fra navnet paa kortet, naar butikken ikke selv har valgt.
  const autoName = autoCardName(design.displayName?.trim() || businessName);
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
        cardName,
      });
      if (res.ok) {
        savedRef.current = JSON.stringify({ design, style, actions, cardName, artworkChanged: false });
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
          <p className="mt-0.5 text-[0.88rem] text-stone">Sådan ser kortet ud på iPhones med iOS 27.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
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
                    "flex flex-col gap-1 rounded-[14px] border-2 p-3 text-left transition-colors disabled:opacity-40",
                    style === s ? "border-ink" : "border-fog hover:border-clay",
                  )}
                >
                  <span className="text-[0.95rem] font-semibold text-ink">{CARD_STYLE_LABEL[s]}</span>
                  <span className="text-[0.78rem] leading-snug text-stone">
                    {ok ? STYLE_HINT[s] : "Kræver stempler"}
                  </span>
                </button>
              );
            })}
          </div>
          {style === "photo" || artwork ? (
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

        {/* Kortets navn: knappen paa butikkens side */}
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Kortets navn</h2>
          <p className="mt-0.5 text-[0.88rem] text-stone">Bruges i knappen, når kunderne henter kortet på din side.</p>
          <input
            value={cardName}
            onChange={(e) => setCardName(e.target.value)}
            maxLength={CARD_NAME_MAX}
            placeholder={autoName}
            aria-label="Kortets navn"
            className="mt-4 w-full rounded-xl border border-fog bg-[#F2F5F9] px-4 py-2.5 text-[0.95rem] text-ink outline-none placeholder:text-slate focus:border-ink"
          />
          <p className="mt-2 text-[0.8rem] text-slate">
            Højst {CARD_NAME_MAX} tegn. Lad feltet stå tomt for at bruge &quot;{autoName}&quot;.
          </p>
          <div className="mt-4 flex justify-center rounded-[14px] bg-[#F2F5F9] p-4">
            <span
              className="flex min-h-11 items-center rounded-2xl px-6 text-[0.92rem] font-medium"
              style={{ background: design.textColor, color: design.primaryColor }}
            >
              {claimCta(cardName.trim() || autoName)}
            </span>
          </div>
        </section>

        {/* Knapper */}
        <section className="rounded-[18px] border border-fog bg-white p-5 shadow-card">
          <h2 className="text-[1.15rem] font-semibold tracking-[-0.015em] text-ink">Knapper på kortet</h2>
          <p className="mt-0.5 text-[0.88rem] text-stone">Op til to genveje under kortet i Wallet (iOS 27).</p>
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
                    {reason ? <span className="block text-[0.78rem] text-slate">{reason}</span> : null}
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

        <div className="sticky bottom-0 z-20 -mx-1 flex flex-wrap items-center gap-3 bg-parchment/95 px-1 py-4 backdrop-blur">
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
            primaryColor={design.primaryColor}
            textColor={design.textColor}
            logoUrl={design.logoUrl ?? null}
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
              ? "Plakatkortet på iOS 27. Eksempel med en kunde, der har 3 stempler."
              : "Ældre iPhones får det klassiske kort, som i dag."}
          </p>
        </div>
      </aside>
    </div>
  );
}
