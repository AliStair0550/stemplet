// Separat PWA-manifest til BUTIKKENS dashboard. Det globale manifest
// (app/manifest.ts) er til kundens webkort og starter paa "/". Dette starter paa
// "/app", saa naar butikken foejer dashboardet til hjemmeskaermen, aabner ikonet
// direkte i dashboardet (ikke forsiden). Linkes kun fra /app og /login via
// metadata.manifest, saa kundens kort beholder sit eget manifest.
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      name: "Stemplet Dashboard",
      short_name: "Stemplet",
      description: "Dit dashboard, altid ved hånden.",
      // Aabner direkte i dashboardet. Er butikken ikke logget ind, sender /app
      // videre til /login, saa de er eet tryk fra at komme ind.
      start_url: "/app",
      // Bredt scope, saa login-flowet (uden for /app) ogsaa koerer i app-tilstand.
      scope: "/",
      display: "standalone",
      background_color: "#FAF8F4",
      theme_color: "#A6502E",
      lang: "da",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any",
        },
        {
          src: "/icon-maskable.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
      shortcuts: [
        {
          name: "Kassemodus",
          short_name: "Kasse",
          description: "Fuldskærms stempel-QR og scanning ved disken.",
          url: "/app/kasse",
        },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
