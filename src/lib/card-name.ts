// Kortets korte navn: bruges i knappen "Hent dit Sara Salon-kort", saa hver
// butik faar sin egen knap. Butikken kan selv vaelge navnet (Design); ellers
// laves det automatisk ud fra navnet paa kortet. Ren logik, saa den kan
// enhedstestes og bruges paa baade server og klient.

export const CARD_NAME_MAX = 16;

// Selskabsformer siger intet for kunden og fylder i knappen.
const LEGAL_SUFFIX = /\s+(aps|a\/s|i\/s|ivs|k\/s|p\/s|amba|smba)\.?$/i;

/**
 * Kort navn ud fra butikkens navn: hele navnet, hvis det er kort nok, ellers de
 * foerste ord, der kan vaere der. Et enkelt langt ord beholdes helt (knappen
 * bryder linjen), saa navnet aldrig klippes midt i et ord.
 */
export function autoCardName(name: string): string {
  const clean = name.trim().replace(/\s+/g, " ").replace(LEGAL_SUFFIX, "").trim();
  if (clean.length <= CARD_NAME_MAX) return clean;
  const words = clean.split(" ");
  let out = words[0]!;
  for (const w of words.slice(1)) {
    const next = `${out} ${w}`;
    if (next.length > CARD_NAME_MAX) break;
    out = next;
  }
  // Et afsluttende bindeord eller tegn ("Philly &", "Bager og") ser forkert ud.
  return out.replace(/\s+(&|og|and|\+|-)$/i, "").trim();
}

/** Butikkens eget valg, ellers det automatiske navn. */
export function cardShortName(b: { cardName?: string | null; displayName?: string | null; name: string }): string {
  return b.cardName?.trim() || autoCardName(b.displayName?.trim() || b.name);
}

/**
 * "Hent dit Sara Salon-kort" (egennavn + kort skrives med bindestreg). Ender
 * navnet allerede paa "kort" (fx "Klubkort"), tilfoejes intet: "Hent dit Klubkort".
 */
export function claimCta(shortName: string): string {
  return /kort$/i.test(shortName.trim()) ? `Hent dit ${shortName.trim()}` : `Hent dit ${shortName}-kort`;
}

/** Tomt = automatisk navn. For langt eller kun tegn giver en fejl. */
export function parseCardName(input: string | null | undefined): { ok: true; value: string | null } | { ok: false; error: string } {
  const v = (input ?? "").trim().replace(/\s+/g, " ");
  if (!v) return { ok: true, value: null };
  if (v.length > CARD_NAME_MAX) return { ok: false, error: `Kortets navn kan højst være ${CARD_NAME_MAX} tegn.` };
  if (!/[\p{L}\p{N}]/u.test(v)) return { ok: false, error: "Kortets navn skal indeholde bogstaver eller tal." };
  return { ok: true, value: v };
}
