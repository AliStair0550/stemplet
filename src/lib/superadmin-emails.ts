// Ren env-parsing af superadmin-emails. Bevidst UDEN import af auth/session, saa
// den kan bruges fra baggrundsjobs (fx kortholder-varsler) uden at traekke hele
// NextAuth-grafen med. Emails laeses fra SUPERADMIN_EMAIL (kommasepareret) -
// ALDRIG hardkodet, da repoet er offentligt.
function parse(): string[] {
  return (process.env.SUPERADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = parse();
  return list.length > 0 && list.includes(email.toLowerCase());
}

/** Superadmin-modtagere til systemvarsler (fx kortholder-taerskler). Tom liste
 *  hvis SUPERADMIN_EMAIL ikke er sat - saa springes varslet bare over. */
export function superadminRecipients(): string[] {
  return parse();
}
