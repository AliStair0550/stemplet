// PWA-manifest til Henvisninger i dashboardet: foejer butikken Henvisninger til
// hjemmeskaermen, aabner ikonet direkte paa arbejdslisten (/app/henvisninger),
// saa den er et tryk vaek, naar der kommer kunder. Sort ikon med hvidt flueben.
// Linkes fra /app/henvisninger via metadata.manifest (se layout.tsx dér).
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
      name: "Henvisninger",
      short_name: "Henvisninger",
      description: "Dine henvisninger, altid ved hånden.",
      start_url: "/app/henvisninger",
      scope: "/",
      display: "standalone",
      background_color: "#FFFFFF",
      theme_color: "#111111",
      lang: "da",
      icons: [
        { src: "/henvisninger-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/henvisninger-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/henvisninger-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    },
    { headers: { "content-type": "application/manifest+json" } },
  );
}
