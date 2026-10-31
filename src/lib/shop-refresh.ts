import "server-only";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { WALLET_ENABLED } from "./env";
import { captureWalletError } from "./sentry";

/**
 * Efter en aendring, der staar paa kundens kort eller butikssiden (navn, regler,
 * funktioner, plan): opdatér den cachede butiksside med det samme og send en
 * stille opdatering til kortene i kundernes Wallet (efter svaret, saa gem er
 * hurtigt). Eet sted, saa ingen aendring glemmer det ene eller det andet.
 */
export function refreshShop(business: { id: string; slug: string }, opts: { wallet?: boolean } = {}): void {
  revalidatePath(`/k/${business.slug}`);
  if (opts.wallet === false || !WALLET_ENABLED) return;
  after(async () => {
    const { pushBusinessWalletPasses } = await import("./wallet/build");
    await pushBusinessWalletPasses(business.id).catch((e) =>
      captureWalletError(e, { operation: "apns:shop-refresh", businessId: business.id }),
    );
  });
}
