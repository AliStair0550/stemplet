import { createHmac, timingSafeEqual } from "node:crypto";
import { APP_URL } from "./env";

// Fravalg af pushbeskeder: linket paa kortets bagside baerer kortets serienummer
// og en signatur, saa kun den, der har kortet, kan slaa beskeder fra eller til
// (serienummeret alene er nok ikke hemmeligt, det staar i stregkoden).

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET mangler.");
  return s;
}

function sign(serial: string): string {
  return createHmac("sha256", secret()).update(`news-optout:${serial}`).digest("base64url").slice(0, 22);
}

export function newsOptOutToken(serial: string): string {
  return `${serial}.${sign(serial)}`;
}

export function newsOptOutUrl(serial: string): string {
  return `${APP_URL}/pushbeskeder/${newsOptOutToken(serial)}`;
}

/** Serienummeret, hvis tokenet er gyldigt; ellers null. */
export function verifyNewsOptOutToken(token: string): string | null {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const serial = token.slice(0, dot);
  const a = Buffer.from(token.slice(dot + 1));
  const b = Buffer.from(sign(serial));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return serial;
}
