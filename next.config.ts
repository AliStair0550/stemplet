import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pakker der bruger Node-native ting (fs, node-forge, streams) og ikke skal
  // bundles af Turbopack. Wallet og PDF koerer kun server-side.
  serverExternalPackages: ["passkit-generator", "@react-pdf/renderer"],
  // Generér ogsaa KLIENT-source maps, saa fejl i browseren faar laesbare stack
  // traces i Sentry (server-maps laves i forvejen). Sentry uploader dem ved
  // build og fjerner dem igen fra klienten (deleteSourcemapsAfterUpload), saa de
  // ikke serveres til brugere.
  productionBrowserSourceMaps: true,
  experimental: {
    // Logo-upload via server action kan vaere op til et par MB.
    serverActions: { bodySizeLimit: "5mb" },
    // Indlejr sidens CSS direkte i HTML'en i stedet for et separat
    // <link rel="stylesheet">. Fjerner en render-blokerende ekstra rundtur, saa
    // foerste billede (First Contentful Paint) kommer hurtigere paa en kold
    // mobilforbindelse. CSS'en er lille (~11 KB), saa HTML'en vokser kun lidt.
    inlineCss: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "utfs.io" },
      { protocol: "https", hostname: "*.ufs.sh" },
    ],
  },
};

// Sentry: uploader source maps ved deploy (paa Vercel, naar SENTRY_AUTH_TOKEN er
// sat), saa stack traces er laesbare. Uden token springes upload bare over, saa
// builds lokalt/uden token fejler ikke. Kilde-maps skjules fra klienten efter
// upload, saa de ikke laekker.
export default withSentryConfig(nextConfig, {
  org: "alius-15",
  project: "stemplet",
  // authToken laeses automatisk fra SENTRY_AUTH_TOKEN i miljoeet (Vercel).
  silent: !process.env.CI,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false,
});
