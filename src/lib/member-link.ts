import { createHmac, timingSafeEqual } from "node:crypto";
import { APP_URL } from "./env";

// "Tilbud og fordele": kortholderens personlige side. Linket (fra knapperne
// under kortet i Wallet) baerer kortets serienummer og en signatur, saa siden
// virker uden login eller cookie, men kun for den, der har kortet.

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET mangler.");
  return s;
}

function sign(serial: string): string {
  return createHmac("sha256", secret()).update(`fordele:${serial}`).digest("base64url").slice(0, 22);
}

export function memberToken(serial: string): string {
  return `${serial}.${sign(serial)}`;
}

export function memberUrl(serial: string): string {
  return `${APP_URL}/fordele/${memberToken(serial)}`;
}

/** Serienummeret, hvis tokenet er gyldigt; ellers null. */
export function verifyMemberToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const serial = token.slice(0, dot);
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(sign(serial));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return serial;
}
