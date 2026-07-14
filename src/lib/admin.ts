import "server-only";
import { auth } from "./auth";

// Superadmin-adgang til platform-overblikket (/admin). Emails laeses fra env
// (SUPERADMIN_EMAIL, kommasepareret) - ALDRIG hardkodet, da repoet er offentligt.
// Er env ikke sat, er admin-siden utilgaengelig for alle.
function superadminEmails(): string[] {
  return (process.env.SUPERADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSuperadminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = superadminEmails();
  return list.length > 0 && list.includes(email.toLowerCase());
}

/** Returnerer den indloggede superadmins email, ellers null. */
export async function getSuperadminEmail(): Promise<string | null> {
  const session = await auth();
  const email = session?.user?.email ?? null;
  return isSuperadminEmail(email) ? email : null;
}
