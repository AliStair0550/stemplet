import "server-only";
import sharp from "sharp";

// Genererer stempel-gitteret som et strip-billede til Wallet-passet, saa kortet
// viser de faktiske stempler (som webkortet) i stedet for bare "3/10".
// Ren SVG -> PNG via sharp. Kun figurer + ikon-stier (ingen tekst), saa det ikke
// afhaenger af fonte paa serveren.

// Inner-markup for hvert stempel-ikon (viewBox 0 0 24 24). currentColor
// erstattes med ikon-farven ved brug.
const ICON_MARKUP: Record<string, string> = {
  coffee:
    '<path d="M5 8h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 9h2.5a2 2 0 0 1 0 4H16"/><path d="M8 3.5c-.4.7-.4 1.3 0 2M11.5 3.5c-.4.7-.4 1.3 0 2"/>',
  scissors:
    '<circle cx="6" cy="7" r="2.2"/><circle cx="6" cy="17" r="2.2"/><path d="M8 8.5 20 17M8 15.5 20 7"/>',
  croissant:
    '<path d="M4 15c3 1 6 1 8-1s2-5 1-8c2 1 4 3 5 6 1 3 0 6-3 7-4 1-9-.5-11-4Z"/>',
  pizza:
    '<path d="M12 3c4 0 7.5 2.2 9 5.5L12 21 3 8.5C4.5 5.2 8 3 12 3Z"/><path d="M5 9.5c4-1.5 10-1.5 14 0"/><circle cx="10" cy="10.5" r="0.6" fill="currentColor"/><circle cx="13.5" cy="12.5" r="0.6" fill="currentColor"/>',
  burger:
    '<path d="M4 9.5c0-3 3.6-5 8-5s8 2 8 5"/><path d="M4 14h16M5 11h14"/><path d="M5 14c0 2.5 3 4 7 4s7-1.5 7-4"/>',
  beer:
    '<path d="M7 8h8v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8Z"/><path d="M15 10h2.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M7 8c-.5-2.5 1-4 2.5-3.5C10 3 11.5 3 12.5 4c1.2-.8 2.5.2 2.5 1.5 0 .9-.5 1.7-1 2.5"/>',
  icecream:
    '<path d="M8 10a4 4 0 0 1 8 0"/><path d="M7.5 11h9l-4.5 9-4.5-9Z"/><path d="M8.5 14h7"/>',
  wine: '<path d="M7 4h10c0 4-2 7-5 7S7 8 7 4Z"/><path d="M12 11v6M9 20h6"/>',
  heart:
    '<path d="M12 20s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7 2.8C19 15.7 12 20 12 20Z"/>',
  star: '<path d="M12 4l2.3 4.9 5.2.7-3.8 3.7.9 5.2L12 16.9 7.4 18.2l.9-5.2L4.5 9.3l5.2-.7L12 4Z"/>',
  custom: '<circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/>',
};

const GIFT_MARKUP =
  '<path d="M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8Z"/><path d="M12 11v9M3 8h18v3H3z"/><path d="M12 8S10.5 4 8.5 4 6 6 8 8M12 8s1.5-4 3.5-4S18 6 16 8"/>';

function iconMarkup(key: string, color: string): string {
  const m = ICON_MARKUP[key] ?? ICON_MARKUP.custom;
  return m.replaceAll("currentColor", color);
}

function esc(n: number): string {
  return Number(n.toFixed(2)).toString();
}

// Blander en hex-farve mod hvid/sort (til mont-praeg paa fyldte stempler).
function mix(hex: string, target: [number, number, number], t: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const m = (x: number, y: number) => Math.round(x * (1 - t) + y * t);
  return (
    "#" +
    [m(r, target[0]), m(g, target[1]), m(b, target[2])]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

const GOLD = "#C9A24B";

// Strip-billederne er deterministiske: samme parametre giver altid samme PNG'er.
// Vi cacher dem pr. proces (varm serverless-instans), saa gentagne pass-bygninger
// slipper for tre sharp-renders. Fx bygger ALLE demo-kort samme 0/10-gitter, og
// rigtige kort deler ofte de samme stempel-tal, saa cachen rammer tit. Nyt logo
// eller nye farver giver en ny noegle, saa der er ingen forael­dede billeder.
const stripCache = new Map<string, { x1: Buffer; x2: Buffer; x3: Buffer }>();
const STRIP_CACHE_MAX = 64;

/** Bygger stempel-gitteret som PNG i tre oploesninger (1x/2x/3x). */
export async function buildStripImages(opts: {
  stamps: number;
  required: number;
  stampIcon: string;
  primaryColor: string;
  textColor: string;
}): Promise<{ x1: Buffer; x2: Buffer; x3: Buffer }> {
  const cacheKey = `${opts.stamps}|${opts.required}|${opts.stampIcon}|${opts.primaryColor}|${opts.textColor}`;
  const hit = stripCache.get(cacheKey);
  if (hit) return hit;

  const W = 1125;
  const P = 70;
  // topAir: luft mellem butikkens logo/header og stemplerne (foer var der kun
  // ~40 px, saa de laa taet paa logoet). PB: bund-padding.
  const topAir = 116;
  const PB = 48;
  // D beregnes paa en fast gitter-hoejde, saa cirklerne har samme stoerrelse
  // uanset den ekstra top-luft; strip'ens samlede hoejde vokser bare med luften.
  const gridBoxH = 352;
  const usableW = W - 2 * P;
  const usableH = gridBoxH;

  const columns =
    opts.required <= 5 ? opts.required : Math.ceil(opts.required / 2);
  const rows = Math.ceil(opts.required / columns);

  const dFromW = usableW / (columns + (columns - 1) * 0.33);
  const dFromH = usableH / (rows + (rows - 1) * 0.28);
  const D = Math.min(dFromW, dFromH, 180);
  const R = D / 2;
  const gapX = D * 0.33;
  const gapY = D * 0.28;
  const gridH = rows * D + (rows - 1) * gapY;
  const startY = topAir;
  const H = startY + gridH + PB;

  const tc = opts.textColor;
  const pc = opts.primaryColor;
  let cells = "";

  for (let i = 0; i < opts.required; i++) {
    const row = Math.floor(i / columns);
    const col = i % columns;
    const inRow = Math.min(columns, opts.required - row * columns);
    const rowW = inRow * D + (inRow - 1) * gapX;
    const startX = (W - rowW) / 2;
    const cx = startX + col * (D + gapX) + R;
    const cy = startY + row * (D + gapY) + R;

    const filled = i < opts.stamps;
    const isGift = i === opts.required - 1;
    const isNext = i === opts.stamps;

    const iconSize = D * 0.5;
    const s = iconSize / 24;
    const tx = cx - iconSize / 2;
    const ty = cy - iconSize / 2;
    const dash = `${esc(D * 0.09)} ${esc(D * 0.09)}`;

    if (isGift) {
      // Beloennings-gaven. Optjent: guldfyldt (aabnet) med gave-ikon i
      // kortfarven. Ikke optjent: guld stiplet cirkel med gave-ikon i guld,
      // saa praemien er synlig hele vejen.
      if (filled) {
        cells +=
          `<circle cx="${esc(cx)}" cy="${esc(cy)}" r="${esc(R)}" fill="${GOLD}"/>` +
          `<g transform="translate(${esc(tx)} ${esc(ty)}) scale(${esc(s)})" fill="none" stroke="${pc}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${GIFT_MARKUP}</g>`;
      } else {
        cells +=
          `<circle cx="${esc(cx)}" cy="${esc(cy)}" r="${esc(R)}" fill="none" stroke="${GOLD}" stroke-width="4" stroke-dasharray="${dash}"/>` +
          `<g transform="translate(${esc(tx)} ${esc(ty)}) scale(${esc(s)})" fill="none" stroke="${GOLD}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GIFT_MARKUP}</g>`;
      }
    } else if (filled) {
      cells +=
        `<circle cx="${esc(cx)}" cy="${esc(cy)}" r="${esc(R)}" fill="url(#coin)"/>` +
        `<g transform="translate(${esc(tx)} ${esc(ty)}) scale(${esc(s)})" fill="none" stroke="${pc}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${iconMarkup(opts.stampIcon, pc)}</g>`;
    } else if (isNext) {
      cells += `<circle cx="${esc(cx)}" cy="${esc(cy)}" r="${esc(R - 3)}" fill="none" stroke="${GOLD}" stroke-width="6"/>`;
    } else {
      cells += `<circle cx="${esc(cx)}" cy="${esc(cy)}" r="${esc(R)}" fill="none" stroke="${tc}" stroke-opacity="0.3" stroke-width="4" stroke-dasharray="${dash}"/>`;
    }
  }

  // Mont-praeg paa de fyldte stempler: lys top-venstre, en anelse moerkere
  // nederst, saa de faar dybde og ser mere kvalitetsfulde ud (ingen fladt fyld).
  const defs =
    `<defs><radialGradient id="coin" cx="0.36" cy="0.30" r="0.85">` +
    `<stop offset="0" stop-color="${mix(tc, [255, 255, 255], 0.16)}"/>` +
    `<stop offset="0.62" stop-color="${tc}"/>` +
    `<stop offset="1" stop-color="${mix(tc, [0, 0, 0], 0.1)}"/>` +
    `</radialGradient></defs>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${defs}${cells}</svg>`;
  const base = Buffer.from(svg);

  // Skaler kun paa bredden, saa hoejde-forholdet (som nu afhaenger af raekker +
  // top-luft) altid bevares paa tvaers af @1x/@2x/@3x.
  const [x3, x2, x1] = await Promise.all([
    sharp(base).png().toBuffer(),
    sharp(base).resize(750).png().toBuffer(),
    sharp(base).resize(375).png().toBuffer(),
  ]);
  const result = { x1, x2, x3 };
  // Simpel FIFO-udskiftning, saa cachen ikke vokser ubegraenset.
  if (stripCache.size >= STRIP_CACHE_MAX) {
    const oldest = stripCache.keys().next().value;
    if (oldest !== undefined) stripCache.delete(oldest);
  }
  stripCache.set(cacheKey, result);
  return result;
}
