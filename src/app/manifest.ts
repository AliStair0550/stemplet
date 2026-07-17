import type { MetadataRoute } from "next";

// PWA-manifest. Gælder webkortet, så kunden kan føje det til hjemmeskærmen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Stemplet",
    short_name: "Stemplet",
    description: "Dit stempelkort. Altid ved hånden.",
    start_url: "/",
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
    // Genvej til kassemodus, saa butikken kan starte direkte i kiosken
    // (Android/Chrome). Paa iOS aabner hjemmeskaerm-ikonet den aktuelle side.
    shortcuts: [
      {
        name: "Kassemodus",
        short_name: "Kasse",
        description: "Fuldskærms stempel-QR og scanning ved disken.",
        url: "/app/kasse",
      },
    ],
  };
}
