// Prismodel (Ali 2026-10-30): tre maaneder gratis fra oprettelsen, derefter
// 49 kr. om maaneden ekskl. moms. Alle moduler, ubegraenset antal kortholdere,
// ingen binding. Faktureres manuelt (Billy), indtil der er et betalingssystem.
export const PRO_PRICE_DKK = 49;
export const TRIAL_MONTHS = 3;
/** Ejeren varsles saa mange dage foer, de gratis maaneder slutter. */
export const TRIAL_WARN_DAYS = 14;

/**
 * Taelleren starter tidligst 1. december 2026 (dansk tid), hvor konceptet
 * relanceres (Ali 2026-10-30). Butikker oprettet foer faar deres tre maaneder
 * derfra, saa ingen faar varsel eller faktura foer relanceringen.
 */
export const TRIAL_COUNT_FROM = new Date("2026-11-30T23:00:00Z");

/** Proeveperiodens start: oprettelsen, men tidligst TRIAL_COUNT_FROM. */
export function trialStartsAt(createdAt: Date): Date {
  return createdAt.getTime() < TRIAL_COUNT_FROM.getTime() ? TRIAL_COUNT_FROM : createdAt;
}

/** Sidste oejeblik i proeveperioden: tre kalendermaaneder efter starten. */
export function trialEndsAt(createdAt: Date): Date {
  const d = new Date(trialStartsAt(createdAt));
  const day = d.getUTCDate();
  // Hold datoen inden for maaneden (30. november + 3 = 28. februar, ikke 2. marts).
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + TRIAL_MONTHS);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

/** Hele dage tilbage af proeveperioden (0 = slutter i dag eller er slut). */
export function trialDaysLeft(createdAt: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((trialEndsAt(createdAt).getTime() - now.getTime()) / 86_400_000));
}
