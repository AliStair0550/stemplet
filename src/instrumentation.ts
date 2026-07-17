import * as Sentry from "@sentry/nextjs";

// Indlaeser den rigtige Sentry-init afhaengigt af runtime. Koeres af Next.js ved
// server-opstart.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Fanger fejl kastet i server-komponenter og route-handlers (fx pass-generering).
export const onRequestError = Sentry.captureRequestError;
