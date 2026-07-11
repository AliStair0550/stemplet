// ── Én sandhedskilde for systemets faste vaerdier ────────────────────
// Baade stempel-motoren OG personale-guiden importerer herfra, saa de aldrig
// kan drifte fra hinanden. AENDRER du en vaerdi her, aendrer den sig begge
// steder samtidig.
//
// VIGTIGT: butiksspecifikke vaerdier (cooldown, antal stempler, beloenning,
// kampagner, om Wallet er slaaet til) hoerer IKKE til her. De bor i databasen
// og hentes live. Kun systemets globale, faste tal staar her.
//
// Denne fil maa ikke importere server-only kode: den bruges baade paa server
// og klient (og af zod-validering).

/** Skaerm-QR-kodens levetid i sekunder, foer der vises en ny. */
export const STAMP_TOKEN_TTL_SECONDS = 60;

/** Hvor laenge en brugt kode huskes (replay-vindue) i sekunder. */
export const STAMP_JTI_TTL_SECONDS = 10 * 60;

/** Standard-cooldown for en NY butik i minutter. Matcher schema-default. */
export const DEFAULT_COOLDOWN_MIN = 120;

/** Personale-PIN: antal forkerte forsoeg foer laasning. */
export const PIN_MAX_ATTEMPTS = 3;

/** Hvor laenge indloesning laases efter for mange forkerte forsoeg (sekunder). */
export const PIN_LOCK_SECONDS = 5 * 60;

/** Gyldigt antal stempler pr. kort. */
export const STAMPS_MIN = 4;
export const STAMPS_MAX = 12;
