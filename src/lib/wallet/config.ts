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
 *
 * Vi TRAEKKER de to blokke ud hver for sig: signer-biblioteket laeser den
 * FOERSTE PEM-blok i signerKey, saa hvis vi giver den den kombinerede PEM
 * (cert foerst), forsoeger den at laese certifikatet som en noegle og fejler.
 */
const CERT_RE =
  /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/;
const KEY_RE =
  /-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/;

// Certifikaterne aendrer sig ikke i en koerende proces. Vi parser dem (base64-
// dekod + regex-udtraek) een gang og genbruger resultatet, saa hver pass-signering
// ikke laver samme arbejde forfra.
let certsCache: {
  wwdr: string;
  signerCert: string;
  signerKey: string;
  signerKeyPassphrase: string | undefined;
} | null = null;

export function walletCertificates() {
  if (certsCache) return certsCache;
  const combined = Buffer.from(requireEnv("APPLE_PASS_CERT"), "base64").toString(
    "utf8",
  );
  const wwdr = Buffer.from(requireEnv("APPLE_WWDR_CERT"), "base64").toString(
    "utf8",
  );
  const cert = combined.match(CERT_RE)?.[0];
  const key = combined.match(KEY_RE)?.[0];
  if (!cert || !key) {
    throw new Error(
      "APPLE_PASS_CERT skal indeholde baade et CERTIFICATE og en PRIVATE KEY (kombineret PEM).",
    );
  }
  certsCache = {
    wwdr,
    signerCert: cert,
    signerKey: key,
    signerKeyPassphrase: process.env.APPLE_PASS_CERT_PASSWORD,
  };
  return certsCache;
}

export function apnsConfig() {
  return {
    key: Buffer.from(requireEnv("APNS_KEY"), "base64").toString("utf8"),
    keyId: requireEnv("APNS_KEY_ID"),
    teamId: requireEnv("APPLE_TEAM_ID"),
    topic: requireEnv("APPLE_PASS_TYPE_ID"),
  };
}
