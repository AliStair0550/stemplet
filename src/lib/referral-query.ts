import { CODE_ALPHABET, normalizeReferralCode } from "./referral-code";

// Endelsen kan kun bestaa af kodens eget alfabet (ingen 0, O, 1, I, L), saa
// et navn som "Anne-Bo" ikke forveksles med en kode.
const CODE_RE = new RegExp(`^[A-Z]{1,6}-[${CODE_ALPHABET}]{2,3}$`);

// Hvad har personalet tastet i kassens soegefelt? Ren logik, saa den kan
// enhedstestes: en kode (SARA-K8), et mobilnummer (cifre) eller et navn.

export type DeskQuery =
  | { kind: "code"; value: string }
  | { kind: "phone"; value: string }
  | { kind: "name"; value: string };

export function classifyDeskQuery(input: string): DeskQuery | null {
  const raw = input.trim();
  if (!raw) return null;
  const code = normalizeReferralCode(raw);
  if (CODE_RE.test(code)) return { kind: "code", value: code };
  // Mobil: kun cifre, mellemrum og +. Delnummer fra 4 cifre ("5678").
  if (/^[\d\s+]+$/.test(raw)) {
    const digits = raw.replace(/\D/g, "");
    return digits.length >= 4 ? { kind: "phone", value: digits } : null;
  }
  const name = raw.replace(/\s+/g, " ");
  return name.length >= 2 ? { kind: "name", value: name } : null;
}
