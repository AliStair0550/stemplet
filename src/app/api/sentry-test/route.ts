import { notFound } from "next/navigation";
import { getSuperadminEmail } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Kontrolleret testfejl til at verificere, at Sentry virker (fejlen fanges af
// onRequestError-hooken og sendes til Sentry med laesbar stack trace).
//
// Kun superadmin kan udloese den (ellers 404), saa den ikke kan misbruges eller
// stoeje fra crawlers. Log ind som superadmin og aabn GET /api/sentry-test -> se
// fejlen lande i Sentry. (Sentry er kun aktiv i produktion.)
export async function GET() {
  const admin = await getSuperadminEmail();
  if (!admin) notFound();
  throw new Error(
    "Sentry-testfejl: kontrolleret verificering fra /api/sentry-test",
  );
}
