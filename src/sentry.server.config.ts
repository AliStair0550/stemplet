import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "@/lib/sentry-scrub";

// Server-side Sentry. Kun i produktion (udviklingsmiljoeet sender aldrig).
// Tracing-sample lavt: vi er paa free tier og braender ikke kvoten paa
// performance-data. Ingen persondata i payloads (beforeSend scrubber).
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  sendDefaultPii: false,
  beforeSend: scrubPii,
});
