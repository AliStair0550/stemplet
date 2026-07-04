import "server-only";
import { requireEnv } from "../env";

// Apple Wallet-konfiguration. Alle værdier læses først når Wallet bruges,
// så build og resten af appen fungerer uden Apple Developer-konto.

export function walletIds() {
  return {
    passTypeIdentifier: requireEnv("APPLE_PASS_TYPE_ID"),
    teamIdentifier: requireEnv("APPLE_TEAM_ID"),
  };
}

/**
 * Certifikater til signering. APPLE_PASS_CERT er base64 af en PEM, der
 * indeholder både signer-certifikatet og den (evt. krypterede) private
 * nøgle. APPLE_WWDR_CERT er base64 af Apples WWDR-certifikat i PEM.
 */
export function walletCertificates() {
  const combined = Buffer.from(requireEnv("APPLE_PASS_CERT"), "base64").toString(
    "utf8",
  );
  const wwdr = Buffer.from(requireEnv("APPLE_WWDR_CERT"), "base64").toString(
    "utf8",
  );
  return {
    wwdr,
    signerCert: combined,
    signerKey: combined,
    signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD,
  };
}

export function apnsConfig() {
  return {
    key: Buffer.from(requireEnv("APNS_KEY"), "base64").toString("utf8"),
    keyId: requireEnv("APNS_KEY_ID"),
    teamId: requireEnv("APPLE_TEAM_ID"),
    topic: requireEnv("APPLE_PASS_TYPE_ID"),
  };
}
