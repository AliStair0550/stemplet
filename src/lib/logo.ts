import "server-only";
import { createHash } from "node:crypto";
import sharp from "sharp";
import { prisma } from "./prisma";

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

// Ved upload: genkod logoet paa serveren, saa det, der gemmes, altid er et
// almindeligt PNG i en fornuftig stoerrelse. Et lille, stærkt komprimeret
// billede kan ellers fylde flere GB i hukommelsen, naar Wallet-ikonet eller
// webkortet tegnes, og det rammer serveren for alle butikker.
const LOGO_MAX_DIM = 1024;
const LOGO_MAX_INPUT_PIXELS = 40_000_000;

export class LogoError extends Error {}

/** data:image/... -> PNG-data-URI (hoejst 1024 px). En http(s)-adresse er uaendret. */
export async function normalizeLogo(src: string | null | undefined): Promise<string | null> {
  if (!src) return null;
  if (!src.startsWith("data:")) return src;
  const m = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/.exec(src);
  if (!m) throw new LogoError("Logoet kunne ikke læses. Brug PNG, JPG eller SVG.");
  try {
    const png = await sharp(Buffer.from(m[1]!, "base64"), {
      failOn: "error",
      limitInputPixels: LOGO_MAX_INPUT_PIXELS,
    })
      .resize({ width: LOGO_MAX_DIM, height: LOGO_MAX_DIM, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 })
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    throw new LogoError("Logoet kunne ikke læses. Prøv et andet billede.");
  }
}

/** Logoet klar til at gemme. Uaendret logo (samme som i forvejen) genkodes ikke. */
export async function logoForSave(
  input: string | null | undefined,
  businessId?: string,
): Promise<{ ok: true; value: string | null } | { ok: false; error: string }> {
  if (!input) return { ok: true, value: null };
  if (businessId) {
    const cur = await prisma.business.findUnique({ where: { id: businessId }, select: { logoUrl: true } });
    if (cur?.logoUrl === input) return { ok: true, value: input };
  }
  try {
    return { ok: true, value: await normalizeLogo(input) };
  } catch (e) {
    if (e instanceof LogoError) return { ok: false, error: e.message };
    throw e;
  }
}
