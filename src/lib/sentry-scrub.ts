import type { ErrorEvent } from "@sentry/nextjs";

// Fjern persondata fra Sentry-events, FOER de sendes. Vi sender ALDRIG navne,
// mails, IP eller cookies i payloads. Kontekst som butik-id, pass-serienummer og
// operation er ikke persondata og bevares, saa fejl kan fejlsoeges.
//
// Bruges som beforeSend i alle Sentry-init (klient, server, edge).

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

export function scrubPii(event: ErrorEvent): ErrorEvent {
  try {
    // Ingen bruger-PII (navn, mail, IP).
    delete event.user;

    if (event.request) {
      delete event.request.cookies;
      // Body kan indeholde mails/PIN o.l. - send den aldrig.
      delete (event.request as { data?: unknown }).data;
      // Query-string kan baere tokens/serials i URL'er - fjern helt.
      if (event.request.query_string) event.request.query_string = "[redacted]";
      const h = event.request.headers as Record<string, string> | undefined;
      if (h) {
        for (const k of Object.keys(h)) {
          const low = k.toLowerCase();
          if (low === "authorization" || low === "cookie") delete h[k];
        }
      }
    }

    // Defensivt: redigér email-lignende strenge overalt i eventet (hvis en mail
    // utilsigtet er havnet i en besked, tag eller extra-felt).
    redactEmails(event);
  } catch {
    // Scrubbing maa aldrig faelde et event; hellere sende (allerede ren) end at kaste.
  }
  return event;
}

// Begraenset rekursion (dybde + cyklus-vaern), saa store/cirkulaere events ikke
// braender CPU eller kaster.
function redactEmails(
  obj: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): void {
  if (depth > 6 || obj === null || typeof obj !== "object") return;
  if (seen.has(obj)) return;
  seen.add(obj);
  const record = obj as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    const val = record[key];
    if (typeof val === "string") {
      const red = val.replace(EMAIL_RE, "[email]");
      if (red !== val) record[key] = red;
    } else if (typeof val === "object" && val !== null) {
      redactEmails(val, depth + 1, seen);
    }
  }
}
