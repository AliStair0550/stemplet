import "server-only";
import * as Sentry from "@sentry/nextjs";

// Fang en fejl i et kritisk Wallet-flow (pass-generering eller APNs-push) og send
// den til Sentry med kontekst nok til fejlsoegning: hvilken operation, hvilken
// butik og hvilket pass. UDEN persondata, kun id'er (butik-id, serienummer er
// pseudonyme). Kaster aldrig selv.
export function captureWalletError(
  err: unknown,
  ctx: {
    operation: string;
    businessId?: string | null;
    serial?: string | null;
    customerCardId?: string | null;
    extra?: Record<string, string | number | boolean | null | undefined>;
  },
): void {
  try {
    Sentry.captureException(err, {
      tags: {
        area: "wallet",
        operation: ctx.operation,
        ...(ctx.businessId ? { businessId: ctx.businessId } : {}),
      },
      contexts: {
        wallet: {
          operation: ctx.operation,
          businessId: ctx.businessId ?? undefined,
          serial: ctx.serial ?? undefined,
          customerCardId: ctx.customerCardId ?? undefined,
          ...ctx.extra,
        },
      },
    });
  } catch {
    // Rapportering maa aldrig faelde selve flowet.
  }
}
