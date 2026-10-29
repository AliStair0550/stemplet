// Pushbeskeder: en kort nyhed fra butikken, der staar paa kundernes kort i Wallet.
// Naar teksten aendres, viser iPhone en notifikation paa laaseskaermen (Wallets
// changeMessage). Ren logik, saa den kan enhedstestes og bruges baade i passet
// og i dashboardet.

export const NEWS_MAX = 150;

/** Hoejst een besked i doegnet: Apple vil have beskeder, der handler om kortet,
 *  og for mange faar kunderne til at slaa notifikationer fra eller slette kortet. */
export const NEWS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function parseNews(input: string | null | undefined): { ok: true; value: string } | { ok: false; error: string } {
  const v = (input ?? "").replace(/\s+/g, " ").trim();
  if (!v) return { ok: false, error: "Skriv en besked." };
  if (v.length > NEWS_MAX) return { ok: false, error: `Beskeden kan højst være ${NEWS_MAX} tegn.` };
  return { ok: true, value: v };
}

/** Wallet viser kun en notifikation, naar teksten AENDRER sig. Samme tekst som
 *  den, der staar paa kortene nu, ville blive sendt uden at nogen faar besked. */
export function sameAsCurrent(text: string, current: string | null | undefined): boolean {
  return !!current && text.trim().toLowerCase() === current.trim().toLowerCase();
}

/** Hvornaar butikken maa sende igen, eller null hvis den maa nu. */
export function nextNewsAllowedAt(lastSentAt: Date | null | undefined, now: Date = new Date()): Date | null {
  if (!lastSentAt) return null;
  const next = new Date(lastSentAt.getTime() + NEWS_COOLDOWN_MS);
  return next > now ? next : null;
}

/** Feltet paa kortets bagside. changeMessage "%@" = selve beskeden som notifikation. */
export function newsField(text: string) {
  return { key: "news", label: "BESKED FRA BUTIKKEN", value: text, changeMessage: "%@" };
}

/** Felt paa bagsiden, hvor kunden slaar pushbeskeder fra (eller til igen).
 *  Wallet goer linket trykbart. Ingen changeMessage: aendringen giver ingen
 *  notifikation. */
export function newsSettingsField(optedOut: boolean, url: string) {
  return {
    key: "news-settings",
    label: "PUSHBESKEDER",
    value: optedOut
      ? `Du har slået beskeder fra butikken fra. Slå dem til igen: ${url}`
      : `Vil du ikke have beskeder fra butikken? Slå dem fra her: ${url}`,
  };
}

/** Bagsidens beskedfelter: selve beskeden (hvis kunden vil have dem) og linket
 *  til at slaa dem fra eller til. */
export function newsBackFields(input: { newsText?: string | null; newsOptOut?: boolean; newsOptOutUrl?: string | null }) {
  const fields: { key: string; label: string; value: string; changeMessage?: string }[] = [];
  if (input.newsText && !input.newsOptOut) fields.push(newsField(input.newsText));
  if (input.newsOptOutUrl && (input.newsText || input.newsOptOut)) {
    fields.push(newsSettingsField(!!input.newsOptOut, input.newsOptOutUrl));
  }
  return fields;
}
