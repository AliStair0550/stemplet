// Mobilnumre gemmes normaliseret, saa "12 34 56 78", "+45 12345678" og
// "004512345678" er det samme nummer (bruges mod selvhenvisning). Ren logik.

/**
 * Danske numre (8 cifre, evt. med +45/0045) -> "+4512345678". Udenlandske numre
 * med + eller 00 beholdes som "+<cifre>". Alt andet giver null.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const raw = input.trim();
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (raw.startsWith("+") || digits.startsWith("00")) {
    const intl = digits.startsWith("00") ? digits.slice(2) : digits;
    if (intl.startsWith("45")) return intl.length === 10 ? `+${intl}` : null;
    return intl.length >= 8 && intl.length <= 15 ? `+${intl}` : null;
  }
  if (digits.length === 8) return `+45${digits}`;
  if (digits.length === 10 && digits.startsWith("45")) return `+${digits}`;
  return null;
}
