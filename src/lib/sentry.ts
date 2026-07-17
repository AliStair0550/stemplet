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

// Fang en UVENTET server-fejl i et API-route (fx DB nede), som ellers bare bliver
// til et 500-svar og et console.error. Route-handlerne fanger disse selv (for at
// give en pæn fejlbesked), saa Next's onRequestError ser dem ikke - derfor sender
// vi dem eksplicit, saa vi opdager dem foer kunderne skriver. Kun id'er/kontekst,
// aldrig persondata. Kaster aldrig selv.
export function captureServerError(
  err: unknown,
  ctx: {
    route: string;
    businessId?: string | null;
    extra?: Record<string, string | number | boolean | null | undefined>;
  },
): void {
  try {
    Sentry.captureException(err, {
      tags: {
        area: "api",
        route: ctx.route,
        ...(ctx.businessId ? { businessId: ctx.businessId } : {}),
      },
      contexts: {
        route: {
          route: ctx.route,
          businessId: ctx.businessId ?? undefined,
          ...ctx.extra,
        },
      },
    });
  } catch {
    // Rapportering maa aldrig faelde selve flowet.
  }
}
