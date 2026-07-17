import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "@/lib/sentry-scrub";

// Edge-runtime Sentry (middleware/edge-routes). Samme regler som server:
// kun produktion, lav tracing-sample, ingen persondata.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.05,
  sendDefaultPii: false,
  beforeSend: scrubPii,
});
