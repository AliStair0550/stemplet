import type { MetadataRoute } from "next";

// PWA-manifest for kort.folka.dk (Folkas f paa moerkeblaat). Dashboard og kasse
// har hvert sit manifest, saa deres hjemmeskaerm-ikon aabner direkte dér.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kundekort",
    short_name: "Kundekort",
    description: "Dit kundekort. Altid ved hånden.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F9FC",
    theme_color: "#061C3D",
    lang: "da",
    icons: [
      {
        src: "/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app-icon-maskable.png",
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
