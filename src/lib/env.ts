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

/** Kaster hvis en påkrævet variabel mangler på runtime (aldrig i build). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Miljøvariabel ${name} mangler.`);
  }
  return value;
}
