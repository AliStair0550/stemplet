import { prisma } from "./prisma";
import { isSuperadminEmail } from "./superadmin-emails";

// Hvem maa logge ind: kun butikker, der allerede findes (selvbetjent oprettelse
// sker paa /start, aldrig via login), samt superadmin, der ikke behoever en butik.

type Db = typeof prisma;

export async function mayLogIn(email: string | null | undefined, db: Db = prisma): Promise<boolean> {
  if (!email) return false;
  if (isSuperadminEmail(email)) return true;
  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  return Boolean(existing);
}
