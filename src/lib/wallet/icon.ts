import sharp from "sharp";
import { createHash } from "node:crypto";
import { STAMP_ICON_PATHS } from "../stamp-icon-paths";
import type { StampIconKey } from "../brand";

// Kortets ikon (icon.png): det, kunden ser ved notifikationer fra Wallet (fx en
// pushbesked) og paa laaseskaermen. Det skal vise BUTIKKEN, ikke os: butikkens
// logo paa dens egen farve, eller uden logo butikkens stempelikon paa kortets
// farve. Apples maal: 29 pt i 1x, 2x og 3x.

const SIZES = [29, 58, 87] as const;
const HEX = /^#[0-9a-f]{6}$/i;

export type PassIconInput = {
  /** Logoets URL/data-URI (noegle til cachen), eller null. */
  logoKey: string | null;
  /** Henter logoet som raa bytes; kaldes kun, naar ikonet ikke er cachet. */
  loadLogo: () => Promise<Buffer | null>;
  primaryColor: string;
  textColor: string;
  stampIcon: string;
};

const cache = new Map<string, { x1: Buffer; x2: Buffer; x3: Buffer }>();
const CACHE_MAX = 100;

function stampSvg(size: number, bg: string, fg: string, icon: string): string {
  const markup = STAMP_ICON_PATHS[icon as StampIconKey] ?? STAMP_ICON_PATHS.custom;
  const s = (size * 0.56) / 24;
  const o = (size - 24 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" fill="${bg}"/><g transform="translate(${o} ${o}) scale(${s})" fill="none" stroke="${fg}" color="${fg}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</g></svg>`;
}

async function render(i: PassIconInput, logo: Buffer | null, size: number): Promise<Buffer> {
  const bg = HEX.test(i.primaryColor) ? i.primaryColor : "#061C3D";
  const fg = HEX.test(i.textColor) ? i.textColor : "#FFFFFF";
  if (logo) {
    try {
      // Logoet centreret med luft paa butikkens farve (Apple runder hjoernerne).
      const inner = Math.round(size * 0.74);
      const fitted = await sharp(logo).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
      return await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
        .composite([{ input: fitted, gravity: "center" }])
        .png()
        .toBuffer();
    } catch {
      // Ulaeseligt logo: fald tilbage til stempelikonet.
    }
  }
  return sharp(Buffer.from(stampSvg(size, bg, fg, i.stampIcon))).png().toBuffer();
}

/** icon.png i 1x, 2x og 3x for butikken (cachet pr. logo, farver og ikon). */
export async function renderPassIcon(i: PassIconInput): Promise<{ x1: Buffer; x2: Buffer; x3: Buffer }> {
  const key = [i.logoKey ? createHash("sha1").update(i.logoKey).digest("hex") : "-", i.primaryColor, i.textColor, i.stampIcon].join("|");
  const hit = cache.get(key);
  if (hit) return hit;
  const logo = i.logoKey ? await i.loadLogo().catch(() => null) : null;
  const [x1, x2, x3] = await Promise.all(SIZES.map((s) => render(i, logo, s)));
  const out = { x1: x1!, x2: x2!, x3: x3! };
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, out);
  return out;
}
