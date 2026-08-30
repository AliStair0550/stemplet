import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";

// Optimerer butikkens logo til en LILLE webp-data-URI, saa det kan bages direkte
// ind i (den CDN-cachede) kort-side uden en ekstra netvaerkshentning. Det giver
// konsistent, oejeblikkelig LCP paa mobil, i stedet for en kold DB/endpoint-miss.
// Kildelogoet er typisk et 512 px PNG (~19 KB); webp ved passende stoerrelse er
// ~4-7 KB. Resultatet caches i hukommelsen pr. (logo, maalstoerrelse), saa sharp
// kun koerer een gang pr. logo pr. serverinstans.

const cache = new Map<string, string | null>();
const CACHE_MAX = 100;

export async function optimizedLogoDataUri(
  src: string | null | undefined,
  maxDim = 400,
): Promise<string | null> {
  if (!src) return null;
  const key = `${maxDim}:${createHash("sha1").update(src).digest("hex")}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;

  let out: string | null = src; // fald tilbage til kilden ved uventet format/fejl
  const m = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (m) {
    try {
      const webp = await sharp(Buffer.from(m[2], "base64"))
        .resize({ width: maxDim, height: maxDim, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      out = `data:image/webp;base64,${webp.toString("base64")}`;
    } catch {
      out = src;
    }
  }

  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, out);
  return out;
}
