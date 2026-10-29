// Login med kode: login-mailen baerer baade et link og en 6-cifret kode. Koden
// ER Auth.js' verifikations-token (generateVerificationToken), saa link og kode
// er det samme engangs-login, og hvad der bruges foerst, logger ind. Koden kan
// skrives ind paa "Tjek din mail" uden at skifte fane eller enhed.
//
// Sikkerhed: 6 cifre er gaetbare, saa callback-ruten er rate-limited pr. e-mail
// (se api/auth/[...nextauth]/route.ts), og koden udloeber efter 15 minutter.

import { randomInt } from "node:crypto";

export const LOGIN_CODE_LENGTH = 6;
export const LOGIN_CODE_TTL_SECONDS = 15 * 60;

/** Cookie med e-mailen, saa "Tjek din mail" ved, hvem koden hoerer til. */
export const LOGIN_EMAIL_COOKIE = "login_email";

export function generateLoginCode(): string {
  return String(randomInt(0, 10 ** LOGIN_CODE_LENGTH)).padStart(LOGIN_CODE_LENGTH, "0");
}

/** "123 456" eller "123-456" -> "123456". */
export function normalizeLoginCode(input: string | null | undefined): string {
  return (input ?? "").replace(/\D/g, "");
}

/** "123456" -> "123 456" (lettere at laese i mailen). */
export function formatLoginCode(code: string): string {
  return code.length === 6 ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}
