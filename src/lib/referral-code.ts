import { randomInt } from "node:crypto";

// Henvisningskoder i formatet NAVN-XX, fx SARA-K8. Ren logik uden I/O, saa
// formatet kan enhedstestes; unikheden pr. butik haandteres af lib/referral
// (unik-indeks + nyt forsoeg ved kollision).

// Uden forvekslelige tegn: ingen 0/O, 1/I/L. 31 tegn -> 961 koder pr. navn.
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export const CODE_NAME_MAX = 6;
// Bruges naar navnet ikke giver nogen bogstaver (tomt, kun tal/tegn).
export const CODE_NAME_FALLBACK = "VEN";

/**
 * Foerste fornavn med store bogstaver uden æøå: Æ->AE, Ø->OE, Å->AA. Andre
 * accenter (é, ü) mister accenten. Kun A-Z, max 6 tegn.
 */
export function codeNamePart(fullName: string | null | undefined): string {
  const first = (fullName ?? "").trim().split(/\s+/)[0] ?? "";
  const upper = first
    .toUpperCase()
    .replace(/Æ/g, "AE")
    .replace(/Ø/g, "OE")
    .replace(/Å/g, "AA")
    .normalize("NFD")
    .replace(/[^A-Z]/g, "");
  return upper.slice(0, CODE_NAME_MAX) || CODE_NAME_FALLBACK;
}

/** Tilfaeldig endelse fra CODE_ALPHABET. rand kan injiceres i tests. */
export function codeSuffix(
  length = 2,
  rand: (max: number) => number = randomInt,
): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[rand(CODE_ALPHABET.length)];
  return out;
}

export function generateReferralCode(
  fullName: string | null | undefined,
  suffixLength = 2,
  rand?: (max: number) => number,
): string {
  return `${codeNamePart(fullName)}-${codeSuffix(suffixLength, rand)}`;
}

/** Kode som kunden har tastet eller faaet i et link: store bogstaver, uden mellemrum. */
export function normalizeReferralCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}
