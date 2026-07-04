// Centraliseret adgang til miljoevariabler og feature flags.
// Bemaerk: hemmeligheder laeses kun server-side. Intet her rammer klienten
// medmindre det har NEXT_PUBLIC_-praefiks.

export const WALLET_ENABLED = process.env.WALLET_ENABLED === "true";

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://stemplet.alius.dk";

export const IS_PROD = process.env.NODE_ENV === "production";

/** Kaster hvis en paakraevet variabel mangler paa runtime (aldrig i build). */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Miljoevariabel ${name} mangler.`);
  }
  return value;
}
