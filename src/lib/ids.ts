import "server-only";
import { randomBytes, randomUUID } from "node:crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // uden let forvekslelige tegn

/** Kort, laesbart serienummer til pass, stregkode og /kort/[serial]. */
export function generateSerial(length = 10): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

/** Hemmeligt authentication token til Wallet-web-servicen. */
export function generateAuthToken(): string {
  return randomBytes(24).toString("hex");
}

export function newDeviceId(): string {
  return randomUUID();
}
