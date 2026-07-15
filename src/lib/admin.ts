import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { auth } from "./auth";

// Superadmin-adgang til platform-overblikket (/admin). Emails laeses fra env
// (SUPERADMIN_EMAIL, kommasepareret) - ALDRIG hardkodet, da repoet er offentligt.
// Er env ikke sat, er admin-siden utilgaengelig for alle.
function superadminEmails(): string[] {
  return (process.env.SUPERADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = superadminEmails();
  return list.length > 0 && list.includes(email.toLowerCase());
}

/** Returnerer den indloggede superadmins email, ellers null. */
export async function getSuperadminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isSuperadminEmail(email) ? email : null;
}

// ── Ekstra kode-laas paa /admin ────────────────────────────────────────────
// Oven paa email-gaten (magisk link) kraeves en hemmelig kode, som KUN du kender
// (ADMIN_ACCESS_CODE i miljoevariabler, aldrig i repoet). Saa selv hvis nogen fik
// adgang til din email-indbakke og loggede ind, kan de ikke aabne admin uden koden.
// Naar koden er indtastet korrekt, saettes en signeret, udloebende cookie.

const UNLOCK_COOKIE = "adm_unlock";
const UNLOCK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dage
export const UNLOCK_COOKIE_NAME = UNLOCK_COOKIE;
export const UNLOCK_TTL_SECONDS = UNLOCK_TTL_MS / 1000;

function adminCode(): string | null {
  const c = process.env.ADMIN_ACCESS_CODE?.trim();
  return c && c.length > 0 ? c : null;
}

/** Er den ekstra kode-laas konfigureret (ADMIN_ACCESS_CODE sat)? */
export function adminCodeConfigured(): boolean {
  return adminCode() !== null;
}

/** Konstant-tids-sammenligning af indtastet kode mod ADMIN_ACCESS_CODE. */
export function verifyAdminCode(input: string): boolean {
  const code = adminCode();
  if (!code) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(code);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Signeringen binder til baade AUTH_SECRET og selve koden: skifter du koden,
// bliver alle eksisterende unlock-cookies ugyldige med det samme.
function signUnlock(expiry: number): string {
  const secret = process.env.AUTH_SECRET ?? "";
  return createHmac("sha256", secret)
    .update(`admin-unlock:${expiry}:${adminCode() ?? ""}`)
    .digest("hex");
}

/** Byg cookie-vaerdi "<udloeb>.<hmac>" til en frisk unlock. */
export function makeUnlockToken(): string {
  const expiry = Date.now() + UNLOCK_TTL_MS;
  return `${expiry}.${signUnlock(expiry)}`;
}

function unlockTokenValid(value: string | undefined): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const expiry = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = signUnlock(expiry);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Er admin laast op? Er ADMIN_ACCESS_CODE ikke sat, er kode-laasen slaaet fra, og
 * kun email-gaten gaelder (bagudkompatibelt). Er den sat, kraeves en gyldig
 * unlock-cookie.
 */
export async function isAdminUnlocked(): Promise<boolean> {
  if (!adminCodeConfigured()) return true;
  const jar = await cookies();
  return unlockTokenValid(jar.get(UNLOCK_COOKIE)?.value);
}
