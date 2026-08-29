import "server-only";
import { X509Certificate } from "node:crypto";
import { walletCertificates } from "./config";
import { sendEmail } from "../send-email";
import { COMPANY } from "../company";
import { captureServerError } from "../sentry";

// Overvaagning af Apple Wallet-certifikaternes udloeb. Udloeber Pass Type ID-
// certifikatet eller Apples WWDR-mellemcertifikat, stopper pas-signeringen HELT
// (uanset iOS-version), saa vi varsler i god tid via mail + Sentry.

const WARN_DAYS = 30;

export type CertStatus = { name: string; validTo: string; daysLeft: number };

// Rene, testbare hjaelpere:
export function daysUntil(date: Date, now: number = Date.now()): number {
  return Math.floor((date.getTime() - now) / 86_400_000);
}

// Milepaele: tidlig heads-up ved 30 og 21 dage, derefter DAGLIGT de sidste 14
// dage (og efter udloeb). Saa spammer vi ikke en hel maaned, men misser det ikke.
export function shouldAlert(daysLeft: number): boolean {
  return daysLeft <= 14 || daysLeft === 30 || daysLeft === 21;
}

// Parser Wallet-certifikaterne og returnerer udloeb + dage tilbage. Kaster ALDRIG:
// er Wallet ikke konfigureret, eller kan et cert ikke parses, springes det over.
export function walletCertStatus(now: number = Date.now()): CertStatus[] {
  let certs: ReturnType<typeof walletCertificates>;
  try {
    certs = walletCertificates();
  } catch {
    return [];
  }
  const out: CertStatus[] = [];
  const parse = (pem: string, name: string) => {
    try {
      const x = new X509Certificate(pem);
      out.push({
        name,
        validTo: x.validTo,
        daysLeft: daysUntil(new Date(x.validTo), now),
      });
    } catch {
      // et cert vi ikke kan parse springes over (ingen falsk alarm)
    }
  };
  parse(certs.signerCert, "Pass Type ID-certifikat");
  parse(certs.wwdr, "Apple WWDR-certifikat");
  return out;
}

/**
 * Tjekker certifikat-udloeb og varsler ved behov (mail til teamet + Sentry).
 * Koeres dagligt fra cron. Idempotent nok: Sentry deduplikerer, og mail sendes
 * kun paa milepaele/urgent-dage, saa vi ikke faar 30 mails i traek.
 */
export async function checkWalletCertExpiry(now: number = Date.now()): Promise<{
  certExpiry: { name: string; daysLeft: number }[];
  certAlerted: boolean;
}> {
  const certs = walletCertStatus(now);
  const summary = certs.map((c) => ({ name: c.name, daysLeft: c.daysLeft }));
  const expiring = certs.filter((c) => c.daysLeft <= WARN_DAYS);
  if (expiring.length === 0) return { certExpiry: summary, certAlerted: false };

  // Synlig i Sentry hver dag inden for vinduet (Sentry deduplikerer selv).
  captureServerError(
    new Error(
      "Wallet-certifikat udloeber snart: " +
        expiring.map((c) => `${c.name} om ${c.daysLeft} dage`).join("; "),
    ),
    { route: "cron:cert-expiry" },
  );

  const alertNow = expiring.filter((c) => shouldAlert(c.daysLeft));
  if (alertNow.length === 0) return { certExpiry: summary, certAlerted: false };

  const urgent = alertNow.some((c) => c.daysLeft <= 7);
  const subject = `${urgent ? "HASTER: " : ""}Apple Wallet-certifikat udløber snart`;
  const rows = alertNow.map(
    (c) =>
      `${c.name}: udløber ${c.validTo} (om ${c.daysLeft} dag${c.daysLeft === 1 ? "" : "e"})`,
  );
  const intro =
    "Et eller flere Apple Wallet-certifikater udløber snart. Forny dem, ellers holder stempelkort i Apple Wallet op med at virke (nye kort kan ikke signeres, og opdateringer stopper).";
  const text = `${intro}\n\n${rows.join("\n")}\n\nPass Type ID-certifikatet fornyes i Apple Developer under Certificates. WWDR-mellemcertifikatet hentes fra Apple. Husk at opdatere APPLE_PASS_CERT / APPLE_WWDR_CERT i Vercel bagefter.`;
  const html =
    `<p>${intro}</p><ul>${alertNow
      .map(
        (c) =>
          `<li><strong>${c.name}</strong>: udløber ${c.validTo} (om ${c.daysLeft} dage)</li>`,
      )
      .join("")}</ul>` +
    `<p>Pass Type ID-certifikatet fornyes i Apple Developer under Certificates. WWDR-mellemcertifikatet hentes fra Apple. Husk at opdatere <code>APPLE_PASS_CERT</code> / <code>APPLE_WWDR_CERT</code> i Vercel bagefter.</p>`;

  try {
    await sendEmail({ to: COMPANY.contactEmail, subject, html, text });
    return { certExpiry: summary, certAlerted: true };
  } catch (e) {
    captureServerError(e, { route: "cron:cert-expiry:email" });
    return { certExpiry: summary, certAlerted: false };
  }
}
