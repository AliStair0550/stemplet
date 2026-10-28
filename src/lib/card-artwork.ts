import "server-only";
import sharp from "sharp";

// Butikkens eget billede til plakatkortet ("Dit billede"). Uanset hvad der
// uploades, beskaerer og genkoder vi det her paa serveren: altid samme maal
// (3x af plakatens 358 x 448 punkter), JPEG uden metadata og lille nok til, at
// Wallet-passet holder sig let.

export const ARTWORK_WIDTH = 1074;
export const ARTWORK_HEIGHT = 1344;
const MAX_INPUT_BYTES = 8 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 450 * 1024;

export class ArtworkError extends Error {}

/** data:image/...;base64,... -> beskaaret JPEG som data-URI. */
export async function processArtwork(dataUri: string): Promise<string> {
  const m = /^data:image\/(jpeg|png|webp|heic|heif|avif);base64,([A-Za-z0-9+/=]+)$/.exec(dataUri);
  if (!m) throw new ArtworkError("Billedet kunne ikke læses. Brug JPG eller PNG.");
  const input = Buffer.from(m[2]!, "base64");
  if (input.length > MAX_INPUT_BYTES) throw new ArtworkError("Billedet er for stort. Vælg et under 8 MB.");

  let quality = 82;
  let out: Buffer;
  try {
    do {
      out = await sharp(input, { failOn: "error" })
        .rotate()
        .resize(ARTWORK_WIDTH, ARTWORK_HEIGHT, { fit: "cover", position: "attention" })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
      quality -= 10;
    } while (out.length > MAX_OUTPUT_BYTES && quality >= 52);
  } catch {
    throw new ArtworkError("Billedet kunne ikke læses. Prøv et andet.");
  }
  return `data:image/jpeg;base64,${out.toString("base64")}`;
}
