// Kundens kontaktdata ved oprettelse af kortet (stempelkort og henvisninger):
// navn og e-mail er paakraevet, samtykke til nyhedsmail er et frivilligt flueben.
// Ren logik, saa den kan enhedstestes og bruges baade i ruter og i biblioteket.

export const CONTACT_NAME_MAX = 40;
export const EMAIL_MAX = 254;

// Bevidst enkel: noget@noget.tld uden mellemrum. Ingen bekraeftelsesmail endnu,
// saa vi fanger kun aabenlyse tastefejl.
const EMAIL_RE = /^[^\s@<>(),;:"\\[\]]+@[^\s@.<>(),;:"\\[\]]+(\.[^\s@.<>(),;:"\\[\]]+)+$/;
// Usynlige tegn og styretegn (NUL, nul-bredde, retningsskift). Postgres afviser
// NUL, og usynlige tegn kan gemme et navn eller snyde det unikke e-mail-tjek.
// ZWJ (U+200D) beholdes, saa sammensatte emoji i navne stadig virker.
const INVISIBLE = /(?!\u200D)[\p{Cc}\p{Cf}]/gu;

/** "  Sara   Jensen " -> "Sara Jensen". Tomt eller for langt giver null. */
export function normalizeName(input: string | null | undefined): string | null {
  const name = (input ?? "").normalize("NFKC").replace(INVISIBLE, "").trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > CONTACT_NAME_MAX) return null;
  return name;
}

/** " Sara@Eksempel.DK " -> "sara@eksempel.dk". Ugyldig giver null. */
export function normalizeEmail(input: string | null | undefined): string | null {
  const email = (input ?? "").trim().toLowerCase();
  if (email.length < 3 || email.length > EMAIL_MAX) return null;
  if (new RegExp(INVISIBLE.source, "u").test(email)) return null;
  return EMAIL_RE.test(email) ? email : null;
}

export type ContactInput = { name: string; email: string; consent?: boolean };
export type Contact = { name: string; email: string; consent: boolean };
export type ContactError = "navn" | "mail";

/** Validér og normalisér formularen. */
export function parseContact(input: ContactInput): { ok: true; contact: Contact } | { ok: false; error: ContactError } {
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "navn" };
  const email = normalizeEmail(input.email);
  if (!email) return { ok: false, error: "mail" };
  return { ok: true, contact: { name, email, consent: input.consent === true } };
}

/** "emma.holm@gmail.com" -> "em***@gmail.com": nok til at kunden genkender sin mail. */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  return `${local.slice(0, 2)}***@${domain}`;
}
