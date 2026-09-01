import type { ErrorEvent } from "@sentry/nextjs";

// Fjern persondata fra Sentry-events, FOER de sendes. Vi sender ALDRIG navne,
// mails, IP eller cookies i payloads. Kontekst som butik-id, pass-serienummer og
// operation er ikke persondata og bevares, saa fejl kan fejlsoeges.
//
// Bruges som beforeSend i alle Sentry-init (klient, server, edge).

const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Er fejlen ren EKSTERN stoej? Dvs. en exception hvor INGEN stak-frame stammer
// fra vores egen app (browser-udvidelser, in-app-browsere, injiceret/cross-origin
// kode). Saadanne fejl (fx "Aa" eller "Maximum call stack" fra en kundes browser)
// er ikke fejl i Stemplet, men fangede af Sentrys globale handler og fylder bare
// loggen. En AEGTE app-fejl har altid mindst een frame fra vores kode
// (/_next/-chunks eller in_app), saa den beholdes.
export function isExternalNoise(event: ErrorEvent): boolean {
  const values = event.exception?.values;
  if (!values || values.length === 0) return false; // ikke en exception -> behold
  const frames = values.flatMap((v) => v.stacktrace?.frames ?? []);
  if (frames.length === 0) return false; // ingen stak -> behold (kan vaere aegte)
  const touchesApp = frames.some((f) => {
    const fn = f.filename ?? "";
    // AEgte app-frames beholdes uanset skema: en WebView kan omskrive vores
    // egne /_next/-chunks til app:///, saa disse signaler vinder foerst.
    if (fn.includes("/_next/") || fn.includes("stemplet.")) return true;
    // Injiceret kode fra in-app-browsere/WebViews koerer som "global code" paa
    // app:/// (og lignende ikke-http-skemaer, fx capacitor:/file:/about:). Det
    // er ALDRIG vores kode, saa Sentrys in_app-markering (sat ud fra sti-navnet,
    // fx app:///start) ignoreres her. Fanger fx "Can't find variable:
    // SCDynimacBridge" og hele familien af native-bro-injektioner. blob: er
    // bevidst UDE: en worker fra vores egen bundle er blob:https://stemplet...
    // og fanges allerede af stemplet.-tjekket ovenfor.
    if (/^(app|capacitor|ionic|file|about):/i.test(fn)) return false;
    return f.in_app === true;
  });
  return !touchesApp;
}

// Transport-fejl paa en Next server-action-fetch (afbrudt forbindelse, brugeren
// navigerede vaek, baggrundet fane paa mobil). Next's router-reducer rapporterer
// det som en TypeError ("Load failed" i WebKit / "Failed to fetch" i Chrome),
// men vores server-actions try/catcher det allerede og viser en paen "prOv igen".
// Det er klient-netvaerksstoej, ikke en app-fejl. Vi dropper KUN, naar baade
// beskeden er en transport-fejl OG stakken peger paa selve server-action-fetchen,
// saa en aegte "Failed to fetch" andre steder stadig rapporteres.
const NETWORK_FAIL_RE =
  /load failed|failed to fetch|networkerror when attempting to fetch|network connection was lost|the request timed out|cancell?ed/i;

export function isServerActionNetworkNoise(event: ErrorEvent): boolean {
  const values = event.exception?.values;
  if (!values || values.length === 0) return false;
  const msg = values.map((v) => v.value ?? "").join(" ");
  if (!NETWORK_FAIL_RE.test(msg)) return false;
  const frames = values.flatMap((v) => v.stacktrace?.frames ?? []);
  return frames.some((f) =>
    /fetchServerAction|server-action-reducer/i.test(
      `${f.function ?? ""} ${f.filename ?? ""}`,
    ),
  );
}

export function scrubPii(event: ErrorEvent): ErrorEvent | null {
  try {
    // Drop ren ekstern browser-stoej, foer noget andet.
    if (isExternalNoise(event)) return null;
    // Drop afbrudte server-action-fetches (klient-netvaerksstoej, ikke app-fejl).
    if (isServerActionNetworkNoise(event)) return null;

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
