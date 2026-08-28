// Dedikeret PWA-manifest til kassen. Kun /kasse linker til det (via
// metadata.manifest), saa naar personalet foejer siden til hjemmeskaermen paa en
// parret enhed, aabner ikonet DIREKTE i kassen (start_url /kasse) i stedet for
// forsiden. En egen "id" goer det til en selvstaendig app ved siden af det
// almindelige Stemplet-manifest, saa de to ikke smelter sammen.
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/kasse",
    name: "Stemplet Kasse",
    short_name: "Kasse",
    description: "Scan kundens kort og giv stempler.",
    start_url: "/kasse",
    display: "standalone",
    background_color: "#FAF8F4",
    theme_color: "#2A1A10",
    lang: "da",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "content-type": "application/manifest+json" },
  });
}
