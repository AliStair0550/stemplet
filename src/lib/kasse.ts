import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { auth } from "./auth";
import QRCode from "qrcode";
import { APP_URL } from "./env";

// ── Kasse-adgang: parret enhed ELLER ejer-login ──────────────────────
// En parret enhed har et langtidsholdbart, begraenset token (kun kassen).
// Ejeren kan altid ogsaa bruge kassen via sit login. Dashboardet
// (indstillinger/priser/fakturering) kraever ALTID ejer-login, aldrig et
// enheds-token.

const KASSE_COOKIE = "stemplet_kasse";
const secure = process.env.NODE_ENV === "production";
// Uden let forvekslelige tegn (ingen 0/O/1/I), saa koden er nem at taste.
const PAIR_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const PAIR_TTL_MIN = 10;
const DEVICE_TTL_SEC = 60 * 60 * 24 * 365 * 2; // 2 aar
const TOUCH_EVERY_MS = 5 * 60_000; // opdater "sidst set" hoejst hvert 5. min

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function generatePairingCode(): string {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += PAIR_ALPHABET[bytes[i] % PAIR_ALPHABET.length];
  return out;
}

export type KasseAccess = {
  businessId: string;
  source: "device" | "owner";
  deviceId?: string;
  userId?: string;
};

/**
 * businessId for den aktive kasse. Foerst en parret enhed (enheds-token),
 * ellers ejerens login. touch=true opdaterer enhedens "sidst set" (kun i
 * route-handlers, ikke under server-render).
 */
export async function kasseAccess(touch = false): Promise<KasseAccess | null> {
  const c = await cookies();
  const token = c.get(KASSE_COOKIE)?.value;
  if (token) {
    const device = await prisma.device.findUnique({
      where: { tokenHash: sha256(token) },
      select: { id: true, businessId: true, revokedAt: true, lastSeenAt: true },
    });
    if (device && !device.revokedAt) {
      if (
        touch &&
        (!device.lastSeenAt ||
          Date.now() - device.lastSeenAt.getTime() > TOUCH_EVERY_MS)
      ) {
        await prisma.device
          .update({ where: { id: device.id }, data: { lastSeenAt: new Date() } })
          .catch(() => {});
      }
      return { businessId: device.businessId, source: "device", deviceId: device.id };
    }
  }
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (businessId) {
    return { businessId, source: "owner", userId: session?.user?.id };
  }
  return null;
}

/** businessId for kassen (enhed eller ejer), ellers null. Til API-endpoints. */
export async function requireKasseBusinessId(): Promise<string | null> {
  const access = await kasseAccess(true);
  return access?.businessId ?? null;
}

// ── Parring ──────────────────────────────────────────────────────────

/** Ejeren genererer en engangs-kode. Returnerer koden + QR til enheden. */
export async function createPairingCode(
  businessId: string,
): Promise<{ code: string; qrDataUrl: string; url: string }> {
  const code = generatePairingCode();
  await prisma.devicePairingCode.create({
    data: {
      businessId,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + PAIR_TTL_MIN * 60_000),
    },
  });
  const url = `${APP_URL}/kasse?kode=${code}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    margin: 1,
    width: 480,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  });
  return { code, qrDataUrl, url };
}

/** Enheden bytter koden til et langtids-token (cookie). Engangsbrug. */
export async function pairDevice(
  code: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length < 6) {
    return { ok: false, error: "Indtast den 6-tegns kode fra dashboardet." };
  }
  const row = await prisma.devicePairingCode.findUnique({
    where: { codeHash: sha256(clean) },
  });
  if (!row || row.usedAt || row.expiresAt < new Date()) {
    return {
      ok: false,
      error: "Koden er ugyldig eller udløbet. Bed ejeren om en ny.",
    };
  }
  // Engangsbrug: markér brugt atomisk, saa den samme kode ikke kan parre to.
  const claimed = await prisma.devicePairingCode.updateMany({
    where: { id: row.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count === 0) {
    return { ok: false, error: "Koden er allerede brugt. Bed ejeren om en ny." };
  }

  const token = randomBytes(32).toString("hex");
  await prisma.device.create({
    data: {
      businessId: row.businessId,
      name: name.trim().slice(0, 40) || "Kasse",
      tokenHash: sha256(token),
      lastSeenAt: new Date(),
    },
  });
  const c = await cookies();
  c.set(KASSE_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_TTL_SEC,
  });
  return { ok: true };
}

/** Fjern enheds-token fra denne enhed (fx "log ud af kassen"). */
export async function clearKasseCookie(): Promise<void> {
  const c = await cookies();
  c.delete(KASSE_COOKIE);
}

// ── Ejerens enheds-styring ───────────────────────────────────────────

export async function listDevices(businessId: string) {
  return prisma.device.findMany({
    where: { businessId, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, lastSeenAt: true, createdAt: true },
  });
}

export async function revokeDevice(businessId: string, deviceId: string) {
  await prisma.device.updateMany({
    where: { id: deviceId, businessId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function renameDevice(
  businessId: string,
  deviceId: string,
  name: string,
) {
  await prisma.device.updateMany({
    where: { id: deviceId, businessId },
    data: { name: name.trim().slice(0, 40) || "Kasse" },
  });
}
