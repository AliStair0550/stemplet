// Centraliseret adgang til miljøvariabler og feature flags.
// Bemærk: hemmeligheder læses kun server-side. Intet her rammer klienten
// medmindre det har NEXT_PUBLIC_-præfiks.

export const WALLET_ENABLED = process.env.WALLET_ENABLED === "true";

// .trim() fjerner et evt. stray mellemrum/tab i env-varen. En tab foran URL'en
// gjorde bl.a. Wallet-passets webServiceURL ugyldig, saa iOS afviste passet.
export const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk"
).trim();

export const IS_PROD = process.env.NODE_ENV === "production";

/**
 * GA4-maale-id. Kun sat paa PRODUKTION, saa preview-deploys og lokal udvikling
 * aldrig sender data til Google. Vi bruger VERCEL_ENV ("production" | "preview"
 * | "development") og ikke NODE_ENV, fordi NODE_ENV ogsaa er "production" i
 * preview-builds. Er variablen ikke sat, indlaeses tagget slet ikke.
 */
export const GA_ID =
  process.env.VERCEL_ENV === "production"
    ? process.env.NEXT_PUBLIC_GA_ID?.trim() || undefined
    : undefined;

/** Kaster hvis en påkrævet variabel mangler på runtime (aldrig i build). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Miljøvariabel ${name} mangler.`);
  }
  return value;
}
