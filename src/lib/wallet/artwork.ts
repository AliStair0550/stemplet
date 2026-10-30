import sharp from "sharp";
import { STAMP_ICON_PATHS } from "../stamp-icon-paths";
import type { StampIconKey } from "../brand";
import type { CardStyle } from "../card-look";

// Plakatbilledet til iOS 27-kortet (artwork.png), tegnet paa serveren ud fra
// butikkens stil. Ingen tekst i billedet (felterne staar i Wallet), saa
// serverens skrifttyper aldrig spiller ind. Maal: 358 x 448 punkter i 1x, 2x
// og 3x. Bunden daekkes af Wallets felt-strimmel, saa det vigtige ligger oeverst.

export const POSTER_W = 358;
export const POSTER_H = 448;

export type ArtworkInput = {
  style: CardStyle;
  primaryColor: string;
  textColor: string;
  stampIcon: string;
  stamps: number;
  required: number;
  /** Butikkens eget billede (data-URI), naar stilen er "photo". */
  photo: string | null;
};

const esc = (c: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : "#2a1a10");

function icon(key: string): string {
  return STAMP_ICON_PATHS[key as StampIconKey] ?? STAMP_ICON_PATHS.custom;
}

function svgFor(i: ArtworkInput, s: number): string {
  const W = POSTER_W * s;
  const H = POSTER_H * s;
  const bg = esc(i.primaryColor);
  const fg = esc(i.textColor);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${POSTER_W} ${POSTER_H}">`;
  if (i.style === "pattern") {
    return `${open}<defs><pattern id="p" width="44" height="44" patternUnits="userSpaceOnUse"><g transform="translate(10 10)" fill="none" stroke="${fg}" stroke-opacity="0.2" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${icon(i.stampIcon)}</g></pattern></defs><rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#p)"/></svg>`;
  }
  if (i.style === "stamps") {
    const cols = 5;
    const gap = 12;
    const size = (POSTER_W - 32 - gap * (cols - 1)) / cols;
    let cells = "";
    for (let k = 0; k < i.required; k++) {
      const x = 16 + (k % cols) * (size + gap);
      const y = 76 + Math.floor(k / cols) * (size + gap);
      const cx = x + size / 2;
      const cy = y + size / 2;
      if (k < i.stamps) {
        const sc = (size * 0.55) / 24;
        cells += `<circle cx="${cx}" cy="${cy}" r="${size / 2}" fill="${fg}"/><g transform="translate(${cx - 12 * sc} ${cy - 12 * sc}) scale(${sc})" fill="none" stroke="${bg}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon(i.stampIcon)}</g>`;
      } else {
        cells += `<circle cx="${cx}" cy="${cy}" r="${size / 2 - 0.75}" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="1.5"/>`;
      }
    }
    return `${open}<rect width="100%" height="100%" fill="${bg}"/>${cells}</svg>`;
  }
  // Farve: hele kortet i butikkens farve (ensfarvet, ingen lys-effekt).
  return `${open}<rect width="100%" height="100%" fill="${bg}"/></svg>`;
}

async function photoAt(i: ArtworkInput, s: number): Promise<Buffer> {
  const W = POSTER_W * s;
  const H = POSTER_H * s;
  const b64 = i.photo!.split(",")[1] ?? "";
  const bg = esc(i.primaryColor);
  // Moerkere bund i butikkens farve, saa felterne altid kan laeses.
  const shade = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="d" x1="0" y1="0" x2="0" y2="1"><stop offset="0.45" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${bg}" stop-opacity="0.9"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#d)"/></svg>`;
  return sharp(Buffer.from(b64, "base64"))
    .resize(W, H, { fit: "cover", position: "attention" })
    .composite([{ input: Buffer.from(shade) }])
    .png({ palette: true, quality: 82, compressionLevel: 9 })
    .toBuffer();
}

/** artwork.png i 1x, 2x og 3x. */
export async function renderPosterArtwork(i: ArtworkInput): Promise<{ x1: Buffer; x2: Buffer; x3: Buffer }> {
  const at = (s: number) =>
    i.style === "photo" && i.photo
      ? photoAt(i, s)
      : sharp(Buffer.from(svgFor(i, s))).png({ compressionLevel: 9 }).toBuffer();
  const [x1, x2, x3] = await Promise.all([at(1), at(2), at(3)]);
  return { x1, x2, x3 };
}
