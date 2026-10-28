import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Pakker der bruger Node-native ting (fs, node-forge, streams) og ikke skal
  // bundles af Turbopack. Wallet og PDF koerer kun server-side.
  serverExternalPackages: ["passkit-generator", "@react-pdf/renderer"],
  // Bundl Instrument Sans-TTF'erne ind i materials-ruten (serverless), saa
  // react-pdf kan indlejre den nye font i print-PDF'erne.
  outputFileTracingIncludes: {
    "/api/materials/*": ["src/fonts/*.ttf"],
  },
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
  // Sikkerhedsheadere paa alle svar. Indlejring kun fra egne sider (plakatens
  // PDF-visning er en iframe paa samme domaene), saa dashboard og kasse ikke kan
  // laegges i en fremmed side (clickjacking). Kameraet bruges af kassens scanner og
  // positionen af "Brug min placering" under Butik og adgang.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(self), payment=()" },
        ],
      },
    ];
  },
  // Appen bor paa kort.folka.dk. Den gamle adresse sender sider videre (fx
  // trykte QR-koder til /k/...), men /api bliver, hvor den er: Wallet-kort, der
  // allerede er hentet, kender stemplet.alius.dk som webServiceURL og skal
  // stadig kunne opdateres. Midlertidig (307), saa den kan rulles tilbage.
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "stemplet.alius.dk" }],
        destination: "https://kort.folka.dk/:path",
        permanent: false,
      },
    ];
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
  // Sentry-projektets slug (Next.js-projektet fik auto-navnet javascript-nextjs).
  // Kan omdoebes i Sentry senere; saa skal denne linje opdateres tilsvarende.
  project: "javascript-nextjs",
  // authToken laeses automatisk fra SENTRY_AUTH_TOKEN i miljoeet (Vercel).
  silent: !process.env.CI,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  telemetry: false,
  // Tree-shake Sentry-kode vi ikke bruger, saa klient-bundlen bliver mindre paa
  // hver side: Session Replay er slaaet fra (ingen grund til at bundle dens
  // shadow-DOM/iframe/worker-kode), og debug-log-statements droppes i prod.
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayShadowDom: true,
    excludeReplayIframe: true,
    excludeReplayWorker: true,
  },
});
