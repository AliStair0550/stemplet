// Tegnede motiver til kortet (stilen "Motiv"): nordlys, sol over horisont,
// boelger, ringe, bakker og buer. Tegnet i butikkens egne farver, saa de altid
// passer sammen og er skarpe i alle stoerrelser. Ren tekst-SVG uden React, saa
// SAMME tegning bruges paa forsiden, i forhaandsvisningen under Design og i det
// rigtige Wallet-kort (artwork.png tegnes paa serveren).

export const CARD_ARTS = ["aurora", "sun", "waves", "rings", "hills", "arches"] as const;
export type Art = (typeof CARD_ARTS)[number];

export const CARD_ART_LABEL: Record<Art, string> = {
  aurora: "Nordlys",
  sun: "Solnedgang",
  waves: "Bølger",
  rings: "Ringe",
  hills: "Bakker",
  arches: "Buer",
};

export function isCardArt(v: unknown): v is Art {
  return typeof v === "string" && (CARD_ARTS as readonly string[]).includes(v);
}

/** Accentfarver, butikken kan vaelge mellem (ud over "automatisk"). */
export const ACCENT_SWATCHES = ["#E7A15B", "#7CC4FF", "#E88B9B", "#8FD1A6", "#C9A24B", "#B9A4E8"] as const;

const HEX = /^#[0-9a-f]{6}$/i;
const safe = (c: string, fallback: string) => (HEX.test(c) ? c : fallback);

function mix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `#${x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, "0")).join("")}`;
}

/** Uden valgt accent: en tone mellem kortets farve og tekstfarven. Altid i stil. */
export function autoAccent(bg: string, fg: string): string {
  return mix(safe(bg, "#061C3D"), safe(fg, "#FFFFFF"), 0.42);
}

export type ArtColors = { bg: string; fg: string; accent?: string | null };

/** Motivet som SVG-indhold i koordinaterne 0 0 100 142 (et staaende kort). */
export function artMarkup(art: Art, colors: ArtColors, id: string): string {
  const bg = safe(colors.bg, "#061C3D");
  const fg = safe(colors.fg, "#FFFFFF");
  const accent = colors.accent && HEX.test(colors.accent) ? colors.accent : autoAccent(bg, fg);
  if (art === "aurora") {
    // Bloede lysfelter (radiale overgange i stedet for sloer): skarpt og let at tegne.
    const glow = (key: string, color: string) =>
      `<radialGradient id="${id}-${key}"><stop offset="0" stop-color="${color}" stop-opacity="0.95"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;
    return `<defs>${glow("a", accent)}${glow("b", fg)}${glow("c", accent)}</defs><rect width="100" height="142" fill="${bg}"/><ellipse cx="22" cy="42" rx="58" ry="40" fill="url(#${id}-a)"/><ellipse cx="88" cy="70" rx="46" ry="38" fill="url(#${id}-b)" opacity="0.32"/><ellipse cx="60" cy="14" rx="40" ry="24" fill="url(#${id}-c)" opacity="0.7"/>`;
  }
  if (art === "sun") {
    const lines = [84, 88, 93, 99]
      .map((y, i) => `<rect x="${20 - i * 4}" y="${y}" width="${60 + i * 8}" height="1.4" rx="0.7" fill="${fg}" opacity="${(0.5 - i * 0.1).toFixed(2)}"/>`)
      .join("");
    return `<defs><linearGradient id="${id}-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="0.62" stop-color="${accent}"/></linearGradient></defs><rect width="100" height="142" fill="url(#${id}-sky)"/><circle cx="50" cy="80" r="24" fill="${fg}" opacity="0.9"/><rect y="80" width="100" height="62" fill="${bg}"/>${lines}`;
  }
  if (art === "waves") {
    const waves = [0, 1, 2, 3, 4]
      .map((i) => {
        const y = 44 + i * 13;
        return `<path d="M-10 ${y} C 15 ${y - 10}, 35 ${y + 12}, 55 ${y} S 95 ${y - 10}, 115 ${y + 2} V 142 H -10 Z" fill="${i % 2 ? accent : fg}" opacity="${(0.12 + i * 0.07).toFixed(2)}"/>`;
      })
      .join("");
    return `<rect width="100" height="142" fill="${bg}"/>${waves}`;
  }
  if (art === "rings") {
    const rings = [8, 16, 24, 32, 40, 48, 56]
      .map((r, i) => `<circle cx="78" cy="40" r="${r}" fill="none" stroke="${i % 2 ? accent : fg}" stroke-width="1.1" opacity="${(0.55 - i * 0.06).toFixed(2)}"/>`)
      .join("");
    return `<rect width="100" height="142" fill="${bg}"/>${rings}<circle cx="78" cy="40" r="5" fill="${accent}"/>`;
  }
  if (art === "hills") {
    return `<rect width="100" height="142" fill="${accent}"/><circle cx="72" cy="30" r="9" fill="${fg}" opacity="0.85"/><path d="M-10 70 Q 25 45 55 66 T 115 58 V 142 H -10 Z" fill="${bg}" opacity="0.55"/><path d="M-10 86 Q 30 64 62 84 T 115 78 V 142 H -10 Z" fill="${bg}" opacity="0.8"/><path d="M-10 102 Q 35 84 70 100 T 115 96 V 142 H -10 Z" fill="${bg}"/>`;
  }
  // arches: buer som et museums soejlegang.
  const arches = [0, 1, 2]
    .map(
      (i) =>
        `<path d="M${8 + i * 30} 84 V 44 a 12 12 0 0 1 24 0 V 84" fill="${i === 1 ? accent : "none"}" stroke="${fg}" stroke-width="1.2" opacity="${i === 1 ? 0.9 : 0.45}"/>`,
    )
    .join("");
  return `<rect width="100" height="142" fill="${bg}"/>${arches}<rect x="4" y="84" width="92" height="1.4" fill="${fg}" opacity="0.5"/>`;
}

/** Hel SVG, der fylder (beskaerer) det givne format, fx Wallets plakat 358 x 448. */
export function artSvg(art: Art, colors: ArtColors, opts: { width: number; height: number; id?: string }): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="0 0 100 142" preserveAspectRatio="xMidYMid slice">${artMarkup(art, colors, opts.id ?? "a")}</svg>`;
}

/** Som CSS-baggrund (forhaandsvisningen under Design). */
export function artDataUri(art: Art, colors: ArtColors): string {
  return `url("data:image/svg+xml,${encodeURIComponent(artSvg(art, colors, { width: 100, height: 142 }))}")`;
}
