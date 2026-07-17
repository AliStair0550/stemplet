import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "@/lib/sentry-scrub";

// Klient-side Sentry. Kun i produktion. Session Replay tilfoejes IKKE (og
// sample-raterne er 0), saa der optages aldrig noget af brugerens skaerm. Lav
// tracing-sample (free tier). Ingen persondata i payloads.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  // Session Replay HELT slaaet fra.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  sendDefaultPii: false,
  beforeSend: scrubPii,
});

// Instrumenterer klient-navigation (App Router).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
