import { createHmac, timingSafeEqual } from "crypto";

// Kortlivet, signeret engangs-agtigt token, der lader en netop oprettet ejer
// komme direkte ind i dashboardet uden foerst at aabne login-mailen. Format:
// <uid>.<exp>.<hmac>. Levetiden er kort, saa et laekket token hurtigt bliver
// ubrugeligt. Login-mailen sendes stadig som backup.
const TTL_MS = 15 * 60 * 1000; // 15 minutter

function secret(): string {
  const s = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET mangler.");
  return s;
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createOnboardingToken(uid: string): string {
  const data = `${uid}.${Date.now() + TTL_MS}`;
  return `${data}.${sign(data)}`;
}

export function verifyOnboardingToken(token: string): { uid: string } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [uid, expStr, mac] = parts;
  const expected = sign(`${uid}.${expStr}`);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  return { uid };
}
